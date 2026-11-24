import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AvatarKey, UserProfile } from '../types/discord';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export interface IncomingDmCall {
  dmId: string;
  callId: string;
  callerUid: string;
  callerName: string;
  callerAvatar: AvatarKey;
  videoOn: boolean;
  screenSharing: boolean;
}

export interface DmRtcCallbacks {
  onRemoteStream: (stream: MediaStream | null) => void;
  onRemoteState: (state: {
    status: 'ringing' | 'connected' | 'ended';
    remoteVideoOn: boolean;
    remoteScreenSharing: boolean;
  }) => void;
  onRemoteEnded: () => void;
}

function makeCallId(): string {
  return `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeSafeCandId(): string {
  return `cand-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function clearCandidateCollection(dmId: string, subName: 'callerCandidates' | 'calleeCandidates') {
  try {
    const snap = await getDocs(collection(db, 'dms', dmId, 'rtc', 'active', subName));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => undefined)));
  } catch {
    /* ignore */
  }
}

export async function captureLocalAudio(): Promise<MediaStream | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null;
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch {
    return null;
  }
}

export async function captureLocalCamera(): Promise<MediaStream | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null;
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch {
    return null;
  }
}

export type ScreenCaptureResult =
  | { ok: true; stream: MediaStream }
  | { ok: false; reason: 'cancelled' | 'unsupported' | 'policy-blocked' | 'error'; message: string };

export async function captureLocalScreen(): Promise<ScreenCaptureResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return {
      ok: false,
      reason: 'unsupported',
      message:
        'Tu navegador o app no soporta captura nativa de pantalla. Usa el Estudio para transmitir imagen, pizarra o video en vivo.',
    };
  }

  const classifyError = (err: unknown): Extract<ScreenCaptureResult, { ok: false }> => {
    const name =
      typeof err === 'object' && err !== null && 'name' in err
        ? String((err as { name: unknown }).name)
        : '';
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();

    if (
      msg.includes('permissions policy') ||
      msg.includes('feature policy') ||
      msg.includes('disallowed')
    ) {
      return {
        ok: false,
        reason: 'policy-blocked',
        message:
          'Este entorno bloquea la captura nativa de pantalla. Usa el Estudio para transmitir imagen, pizarra o video en vivo.',
      };
    }

    if (name === 'AbortError' || name === 'NotAllowedError') {
      return {
        ok: false,
        reason: 'cancelled',
        message: 'Captura de pantalla cancelada.',
      };
    }

    if (name === 'NotSupportedError' || name === 'TypeError') {
      return {
        ok: false,
        reason: 'unsupported',
        message:
          'Captura nativa no disponible en este dispositivo. Usa el Estudio para compartir en vivo.',
      };
    }

    return {
      ok: false,
      reason: 'error',
      message: 'No se pudo capturar la pantalla; puedes usar el Estudio para compartir en vivo.',
    };
  };

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30, max: 60 } },
      audio: true,
    });
    return { ok: true, stream };
  } catch (err) {
    const firstPass = classifyError(err);
    if (firstPass.reason === 'cancelled' || firstPass.reason === 'policy-blocked') {
      return firstPass;
    }
    try {
      const fallbackStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      return { ok: true, stream: fallbackStream };
    } catch (fallbackErr) {
      return classifyError(fallbackErr);
    }
  }
}

export class DmWebRtcController {
  private dmId: string;
  private myUid: string;
  private role: 'caller' | 'callee';
  private callId: string;
  private pc: RTCPeerConnection;
  private audioTransceiver: RTCRtpTransceiver | null = null;
  private videoTransceiver: RTCRtpTransceiver | null = null;
  private remoteStream = new MediaStream();
  private unsubDoc: Unsubscribe | null = null;
  private unsubCands: Unsubscribe | null = null;
  private appliedOfferSeq = 1;
  private appliedAnswerSeq = 0;
  private localOfferSeq = 1;
  private localAnswerSeq = 1;
  private addedCandIds = new Set<string>();
  private queuedIce: RTCIceCandidateInit[] = [];
  private disposed = false;
  private callbacks: DmRtcCallbacks;

  constructor(params: {
    dmId: string;
    myUid: string;
    role: 'caller' | 'callee';
    callId?: string;
    callbacks: DmRtcCallbacks;
  }) {
    this.dmId = params.dmId;
    this.myUid = params.myUid;
    this.role = params.role;
    this.callId = params.callId || makeCallId();
    this.callbacks = params.callbacks;
    this.pc = new RTCPeerConnection(RTC_CONFIG);

    this.pc.ontrack = (event) => {
      if (this.disposed) return;
      const track = event.track;
      const emitStream = () => {
        if (!this.disposed) {
          this.callbacks.onRemoteStream(new MediaStream(this.remoteStream.getTracks()));
        }
      };
      const alreadyHas = this.remoteStream.getTracks().some((t) => t.id === track.id);
      if (!alreadyHas) {
        this.remoteStream.addTrack(track);
      }
      track.onunmute = emitStream;
      track.onended = emitStream;
      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!this.remoteStream.getTracks().some((existing) => existing.id === t.id)) {
            this.remoteStream.addTrack(t);
            t.onunmute = emitStream;
            t.onended = emitStream;
          }
        });
      }
      emitStream();
    };

    this.pc.onicecandidate = (event) => {
      if (this.disposed || !event.candidate) return;
      const subName = this.role === 'caller' ? 'callerCandidates' : 'calleeCandidates';
      const candRef = doc(db, 'dms', this.dmId, 'rtc', 'active', subName, makeSafeCandId());
      void setDoc(candRef, {
        callId: this.callId,
        uid: this.myUid,
        candidate: event.candidate.candidate || '',
        sdpMid: event.candidate.sdpMid ?? null,
        sdpMLineIndex:
          typeof event.candidate.sdpMLineIndex === 'number' ? event.candidate.sdpMLineIndex : null,
        createdAt: serverTimestamp(),
      }).catch(() => undefined);
    };
  }

  private ensureTransceivers() {
    const existing = this.pc.getTransceivers();
    this.audioTransceiver =
      existing.find((t) => t.sender.track?.kind === 'audio' || t.receiver.track?.kind === 'audio') ||
      null;
    this.videoTransceiver =
      existing.find((t) => t.sender.track?.kind === 'video' || t.receiver.track?.kind === 'video') ||
      null;
    if (!this.audioTransceiver && this.role === 'caller') {
      this.audioTransceiver = this.pc.addTransceiver('audio', { direction: 'sendrecv' });
    }
    if (!this.videoTransceiver && this.role === 'caller') {
      this.videoTransceiver = this.pc.addTransceiver('video', { direction: 'sendrecv' });
    }
    if (this.audioTransceiver) {
      try {
        this.audioTransceiver.direction = 'sendrecv';
      } catch {
        /* ignore */
      }
    }
    if (this.videoTransceiver) {
      try {
        this.videoTransceiver.direction = 'sendrecv';
      } catch {
        /* ignore */
      }
    }
  }

  private async renegotiate() {
    if (this.disposed || this.pc.signalingState !== 'stable') return;
    try {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.localOfferSeq += 1;
      await updateDoc(doc(db, 'dms', this.dmId, 'rtc', 'active'), {
        offer: {
          type: offer.type,
          sdp: offer.sdp || '',
          seq: this.localOfferSeq,
        },
        updatedAt: serverTimestamp(),
      });
    } catch {
      /* ignore */
    }
  }

  async setAudioTrack(track: MediaStreamTrack | null) {
    if (this.disposed) return;
    this.ensureTransceivers();
    if (this.audioTransceiver) {
      await this.audioTransceiver.sender.replaceTrack(track).catch(() => undefined);
    } else if (track) {
      this.audioTransceiver = this.pc.addTransceiver(track, { direction: 'sendrecv' });
    }
  }

  async setVideoTrack(track: MediaStreamTrack | null, isScreen = false) {
    if (this.disposed) return;
    this.ensureTransceivers();
    if (track && isScreen && 'contentHint' in track) {
      try {
        track.contentHint = 'detail';
      } catch {
        /* ignore */
      }
    }
    if (this.videoTransceiver) {
      this.videoTransceiver.direction = 'sendrecv';
      await this.videoTransceiver.sender.replaceTrack(track).catch(() => undefined);
      if (track) {
        try {
          const params = this.videoTransceiver.sender.getParameters();
          if (params.encodings && params.encodings.length > 0) {
            params.encodings[0].maxBitrate = isScreen ? 2500000 : 1400000;
            await this.videoTransceiver.sender.setParameters(params).catch(() => undefined);
          }
        } catch {
          /* ignore */
        }
      }
      const dir = this.videoTransceiver.currentDirection;
      if (track && (dir === 'recvonly' || dir === 'inactive' || dir === null)) {
        await this.renegotiate();
      }
    } else if (track) {
      this.videoTransceiver = this.pc.addTransceiver(track, { direction: 'sendrecv' });
      await this.renegotiate();
    }
  }

  async updateMediaFlags(flags: { videoOn?: boolean; screenSharing?: boolean }) {
    if (this.disposed) return;
    const rtcRef = doc(db, 'dms', this.dmId, 'rtc', 'active');
    const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (this.role === 'caller') {
      if (flags.videoOn !== undefined) patch.callerVideoOn = flags.videoOn;
      if (flags.screenSharing !== undefined) patch.callerScreenSharing = flags.screenSharing;
    } else {
      if (flags.videoOn !== undefined) patch.calleeVideoOn = flags.videoOn;
      if (flags.screenSharing !== undefined) patch.calleeScreenSharing = flags.screenSharing;
    }
    if (flags.screenSharing !== undefined) patch.screenSharing = flags.screenSharing;
    if (flags.videoOn !== undefined) patch.videoOn = flags.videoOn;
    await updateDoc(rtcRef, patch).catch(() => undefined);
  }

  async startAsCaller(params: {
    currentUser: UserProfile;
    calleeUid?: string;
    audioTrack: MediaStreamTrack | null;
    videoTrack: MediaStreamTrack | null;
    videoOn: boolean;
    screenSharing: boolean;
  }) {
    const { currentUser, calleeUid, audioTrack, videoTrack, videoOn, screenSharing } = params;
    await clearCandidateCollection(this.dmId, 'callerCandidates');
    await clearCandidateCollection(this.dmId, 'calleeCandidates');

    this.ensureTransceivers();
    if (audioTrack) await this.setAudioTrack(audioTrack);
    if (videoTrack) await this.setVideoTrack(videoTrack, screenSharing);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    const rtcRef = doc(db, 'dms', this.dmId, 'rtc', 'active');
    await setDoc(rtcRef, {
      id: 'active',
      callId: this.callId,
      callerUid: currentUser.id,
      callerName: (currentUser.displayName || currentUser.username || 'Usuario').slice(0, 40),
      callerAvatar: (currentUser.avatar || 'madara').slice(0, 32),
      calleeUid: calleeUid || '',
      status: 'ringing',
      active: true,
      videoOn,
      screenSharing,
      callerVideoOn: videoOn,
      callerScreenSharing: screenSharing,
      calleeVideoOn: false,
      calleeScreenSharing: false,
      offer: {
        type: offer.type,
        sdp: offer.sdp || '',
        seq: 1,
      },
      answer: null,
      updatedAt: serverTimestamp(),
    });

    this.subscribeSignaling('calleeCandidates');
  }

  async answerAsCallee(params: {
    audioTrack: MediaStreamTrack | null;
    videoTrack: MediaStreamTrack | null;
    videoOn: boolean;
    screenSharing: boolean;
    offer: { type: RTCSdpType; sdp: string };
  }) {
    const { audioTrack, videoTrack, videoOn, screenSharing, offer } = params;
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    this.ensureTransceivers();
    if (audioTrack) await this.setAudioTrack(audioTrack);
    if (videoTrack) await this.setVideoTrack(videoTrack, screenSharing);

    for (const c of this.queuedIce) {
      await this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => undefined);
    }
    this.queuedIce = [];

    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);

    const rtcRef = doc(db, 'dms', this.dmId, 'rtc', 'active');
    await updateDoc(rtcRef, {
      status: 'connected',
      calleeVideoOn: videoOn,
      calleeScreenSharing: screenSharing,
      answer: {
        type: answer.type,
        sdp: answer.sdp || '',
        seq: 1,
      },
      updatedAt: serverTimestamp(),
    });

    this.subscribeSignaling('callerCandidates');
  }

  private subscribeSignaling(remoteCandCollection: 'callerCandidates' | 'calleeCandidates') {
    const rtcRef = doc(db, 'dms', this.dmId, 'rtc', 'active');
    this.unsubDoc = onSnapshot(rtcRef, async (snap) => {
      if (this.disposed) return;
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.callId !== this.callId) return;

      if (!d.active || d.status === 'ended') {
        this.callbacks.onRemoteEnded();
        return;
      }

      if (this.role === 'caller' && d.answer && d.answer.sdp && d.answer.seq > this.appliedAnswerSeq) {
        this.appliedAnswerSeq = d.answer.seq;
        try {
          await this.pc.setRemoteDescription(
            new RTCSessionDescription({ type: d.answer.type, sdp: d.answer.sdp })
          );
          for (const c of this.queuedIce) {
            await this.pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => undefined);
          }
          this.queuedIce = [];
        } catch {
          /* ignore */
        }
      }

      if (this.role === 'callee' && d.offer && d.offer.sdp && d.offer.seq > this.appliedOfferSeq) {
        this.appliedOfferSeq = d.offer.seq;
        try {
          await this.pc.setRemoteDescription(
            new RTCSessionDescription({ type: d.offer.type, sdp: d.offer.sdp })
          );
          this.ensureTransceivers();
          const answer = await this.pc.createAnswer();
          await this.pc.setLocalDescription(answer);
          this.localAnswerSeq += 1;
          await updateDoc(rtcRef, {
            answer: {
              type: answer.type,
              sdp: answer.sdp || '',
              seq: this.localAnswerSeq,
            },
            updatedAt: serverTimestamp(),
          });
        } catch {
          /* ignore */
        }
      }

      const remoteVideoOn =
        this.role === 'caller' ? Boolean(d.calleeVideoOn) : Boolean(d.callerVideoOn);
      const remoteScreenSharing =
        this.role === 'caller' ? Boolean(d.calleeScreenSharing) : Boolean(d.callerScreenSharing);

      this.callbacks.onRemoteState({
        status: d.status || 'ringing',
        remoteVideoOn,
        remoteScreenSharing,
      });
    });

    const candsCol = collection(db, 'dms', this.dmId, 'rtc', 'active', remoteCandCollection);
    this.unsubCands = onSnapshot(candsCol, async (snap) => {
      if (this.disposed) return;
      for (const docSnap of snap.docs) {
        if (this.addedCandIds.has(docSnap.id)) continue;
        const d = docSnap.data();
        if (d.callId !== this.callId || !d.candidate) continue;
        this.addedCandIds.add(docSnap.id);
        const init: RTCIceCandidateInit = {
          candidate: d.candidate,
          sdpMid: d.sdpMid ?? undefined,
          sdpMLineIndex: typeof d.sdpMLineIndex === 'number' ? d.sdpMLineIndex : undefined,
        };
        if (this.pc.remoteDescription) {
          await this.pc.addIceCandidate(new RTCIceCandidate(init)).catch(() => undefined);
        } else {
          this.queuedIce.push(init);
        }
      }
    });
  }

  async hangup(notifyRemote = true) {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubDoc?.();
    this.unsubCands?.();
    this.unsubDoc = null;
    this.unsubCands = null;

    if (notifyRemote) {
      try {
        await updateDoc(doc(db, 'dms', this.dmId, 'rtc', 'active'), {
          active: false,
          status: 'ended',
          updatedAt: serverTimestamp(),
        });
      } catch {
        /* ignore */
      }
    }

    try {
      this.pc.close();
    } catch {
      /* ignore */
    }
  }
}

export async function rejectDmIncomingCall(dmId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'dms', dmId, 'rtc', 'active'), {
      active: false,
      status: 'ended',
      updatedAt: serverTimestamp(),
    });
  } catch {
    /* ignore */
  }
}

export function subscribeToIncomingDmCalls(
  dmIds: string[],
  myUid: string,
  onIncoming: (calls: IncomingDmCall[]) => void
): Unsubscribe {
  const uniqueIds = Array.from(new Set(dmIds.filter((id) => id && !id.startsWith('dm-grp-')))).slice(
    0,
    20
  );
  if (uniqueIds.length === 0) {
    onIncoming([]);
    return () => undefined;
  }

  const callMap = new Map<string, IncomingDmCall>();
  const emit = () => {
    onIncoming(Array.from(callMap.values()));
  };

  const unsubs = uniqueIds.map((dmId) =>
    onSnapshot(
      doc(db, 'dms', dmId, 'rtc', 'active'),
      (snap) => {
        if (!snap.exists()) {
          callMap.delete(dmId);
          emit();
          return;
        }
        const d = snap.data();
        const isIncoming =
          Boolean(d.active) &&
          d.status === 'ringing' &&
          typeof d.callerUid === 'string' &&
          d.callerUid !== myUid &&
          Boolean(d.offer?.sdp);
        if (isIncoming) {
          callMap.set(dmId, {
            dmId,
            callId: String(d.callId || ''),
            callerUid: String(d.callerUid),
            callerName: String(d.callerName || 'Usuario'),
            callerAvatar: (d.callerAvatar as AvatarKey) || 'madara',
            videoOn: Boolean(d.callerVideoOn || d.videoOn),
            screenSharing: Boolean(d.callerScreenSharing || d.screenSharing),
          });
        } else {
          callMap.delete(dmId);
        }
        emit();
      },
      () => undefined
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}
