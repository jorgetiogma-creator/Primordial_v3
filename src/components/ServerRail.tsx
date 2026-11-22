import React, { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  Compass,
  MessageCircle,
  Plus,
  Star,
} from 'lucide-react';
import { Server } from '../types/discord';
import { ServerIconArt } from './DiscordArt';

interface ServerRailProps {
  servers: Server[];
  activeContext:
    | { type: 'dm' }
    | { type: 'favorites' }
    | { type: 'servidores' }
    | { type: 'server'; serverId: string };
  onSelectDm: () => void;
  onSelectFavorites: () => void;
  onSelectServer: (serverId: string) => void;
  onOpenBotDm: () => void;
  onOpenAddServer: () => void;
  onOpenDiscover: () => void;
  onMoveServer?: (serverId: string, direction: 'up' | 'down') => void;
}

export const ServerRail: React.FC<ServerRailProps> = ({
  servers,
  activeContext,
  onSelectDm,
  onSelectFavorites,
  onSelectServer,
  onOpenAddServer,
  onOpenDiscover,
  onMoveServer,
}) => {
  const [reorderMode, setReorderMode] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const isDmActive = activeContext.type === 'dm';
  const isFavActive = activeContext.type === 'favorites';

  const startPress = () => {
    if (!onMoveServer || servers.length < 2) return;
    longPressTriggeredRef.current = false;
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setReorderMode((prev) => !prev);
    }, 480);
  };

  const cancelPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <aside
      aria-label="Lista de servidores"
      className="w-[70px] shrink-0 bg-[#111214] flex flex-col items-center py-2.5 gap-2 overflow-y-auto no-scrollbar select-none"
    >
      {/* Direct Messages Pill Button */}
      <div className="relative w-full flex items-center justify-center group">
        {isDmActive && (
          <span className="absolute left-0 w-1 h-9 bg-white rounded-r-full transition-all duration-200" />
        )}
        <button
          onClick={onSelectDm}
          title="Mensajes directos"
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isDmActive
              ? 'bg-[#5865F2] text-white rounded-2xl shadow-lg'
              : 'bg-[#26272f] text-[#b5bac1] rounded-full hover:rounded-2xl hover:bg-[#5865F2] hover:text-white'
          }`}
        >
          <MessageCircle className="w-6 h-6 fill-current" />
        </button>
      </div>

      {/* Horizontal 32px Divider */}
      <div className="w-[32px] h-[2px] bg-[#2e3035] rounded-full my-0.5 shrink-0" />

      {/* Favorites Star */}
      <div className="relative w-full flex items-center justify-center">
        {isFavActive && (
          <span className="absolute left-0 w-1 h-9 bg-white rounded-r-full transition-all duration-200" />
        )}
        <button
          onClick={onSelectFavorites}
          title="Favoritos"
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isFavActive
              ? 'bg-[#5865F2] text-white rounded-2xl'
              : 'bg-[#26272f] text-[#b5bac1] rounded-full hover:rounded-2xl hover:bg-[#5865F2] hover:text-white'
          }`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      </div>

      {reorderMode && (
        <button
          type="button"
          onClick={() => setReorderMode(false)}
          title="Terminar orden"
          className="px-2 py-1 rounded-full bg-[#23a55a] text-white text-[10px] font-bold flex items-center gap-0.5 shadow cursor-pointer"
        >
          <Check className="w-3 h-3" />
          <span>Listo</span>
        </button>
      )}

      {/* Server Icons */}
      {servers.map((srv, idx) => {
        const isActive = activeContext.type === 'server' && activeContext.serverId === srv.id;
        return (
          <div key={srv.id} className="relative w-full flex flex-col items-center justify-center group gap-1">
            <div className="relative w-full flex items-center justify-center">
              {isActive ? (
                <span className="absolute left-0 w-1 h-9 bg-white rounded-r-full transition-all duration-200" />
              ) : srv.hasUnread ? (
                <span className="absolute left-0 w-1 h-2 bg-white rounded-r-full group-hover:h-5 transition-all duration-200" />
              ) : null}

              <button
                type="button"
                onPointerDown={startPress}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onPointerCancel={cancelPress}
                onClick={() => {
                  if (longPressTriggeredRef.current) return;
                  onSelectServer(srv.id);
                }}
                title={`${srv.name}${onMoveServer && servers.length > 1 ? ' (mantén presionado para reordenar)' : ''}`}
                className="relative w-12 h-12 cursor-pointer transition-transform active:scale-95"
              >
                <div
                  className={`w-12 h-12 overflow-hidden transition-all duration-200 ${
                    isActive ? 'rounded-2xl' : 'rounded-full hover:rounded-2xl'
                  }`}
                >
                  <ServerIconArt server={srv} />
                </div>

                {srv.hasEventBadge && (
                  <span className="absolute -top-1 -right-1 w-[19px] h-[19px] rounded-full bg-[#26272f] text-[#f2f3f5] flex items-center justify-center border-2 border-[#111214] shadow">
                    <CalendarDays className="w-2.5 h-2.5" />
                  </span>
                )}

                {typeof srv.badgeCount === 'number' && srv.badgeCount > 0 && (
                  <span className="absolute -bottom-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-[#f23f43] text-white text-[10.5px] font-extrabold tabular-nums flex items-center justify-center border-[2.5px] border-[#111214] leading-none">
                    {srv.badgeCount}
                  </span>
                )}
              </button>
            </div>

            {reorderMode && onMoveServer && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMoveServer(srv.id, 'up')}
                  aria-label={`Subir ${srv.name}`}
                  className="w-5 h-5 rounded-md bg-[#26272f] border border-[#2e3035] flex items-center justify-center text-[#b5bac1] disabled:opacity-30 cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === servers.length - 1}
                  onClick={() => onMoveServer(srv.id, 'down')}
                  aria-label={`Bajar ${srv.name}`}
                  className="w-5 h-5 rounded-md bg-[#26272f] border border-[#2e3035] flex items-center justify-center text-[#b5bac1] disabled:opacity-30 cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Server & Discover */}
      <button
        onClick={onOpenAddServer}
        title="Servidores · Crear o unirse"
        className={`w-12 h-12 rounded-full hover:rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 mt-1 ${
          activeContext.type === 'servidores'
            ? 'bg-[#23a55a] text-white rounded-2xl'
            : 'bg-[#26272f] hover:bg-[#23a55a] text-[#23a55a] hover:text-white'
        }`}
      >
        <Plus className="w-6 h-6" />
      </button>

      <button
        onClick={onOpenDiscover}
        title="Descubrir servidores públicos"
        className="w-12 h-12 rounded-full hover:rounded-2xl bg-[#26272f] hover:bg-[#23a55a] text-[#23a55a] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 mb-2"
      >
        <Compass className="w-5 h-5" />
      </button>
    </aside>
  );
};
