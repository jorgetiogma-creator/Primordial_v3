import React from 'react';
import { CalendarDays, Compass, MessageCircle, Plus, Star } from 'lucide-react';
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
}

export const ServerRail: React.FC<ServerRailProps> = ({
  servers,
  activeContext,
  onSelectDm,
  onSelectFavorites,
  onSelectServer,
  onOpenBotDm,
  onOpenAddServer,
  onOpenDiscover,
}) => {
  const isDmActive = activeContext.type === 'dm';
  const isFavActive = activeContext.type === 'favorites';

  return (
    <aside
      aria-label="Lista de servidores"
      className="w-[70px] shrink-0 bg-[var(--dc-bg-rail)] flex flex-col items-center py-2.5 gap-2 overflow-y-auto no-scrollbar select-none"
    >
      {/* Direct Messages Pill Button */}
      <div className="relative w-full flex items-center justify-center group">
        {isDmActive && (
          <span className="absolute left-0 w-1 h-9 bg-white rounded-r-full transition-all" />
        )}
        <button
          onClick={onSelectDm}
          title="Mensajes directos"
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isDmActive
              ? 'bg-[#5865F2] text-white rounded-2xl shadow-lg'
              : 'bg-[var(--dc-bg-card)] text-[var(--dc-text-secondary)] rounded-full hover:rounded-2xl hover:bg-[var(--dc-bg-elevated)] hover:text-[var(--dc-text-primary)]'
          }`}
        >
          <MessageCircle className="w-6 h-6 fill-current" />
        </button>
      </div>

      {/* Divider right below main DM button */}
      <div className="w-8 h-[2px] bg-[#2e3035] rounded-full my-0.5 shrink-0" />

      {/* Favorites Star */}
      <div className="relative w-full flex items-center justify-center">
        {isFavActive && (
          <span className="absolute left-0 w-1 h-9 bg-white rounded-r-full" />
        )}
        <button
          onClick={onSelectFavorites}
          title="Favoritos"
          className={`w-12 h-12 flex items-center justify-center transition-all duration-200 cursor-pointer ${
            isFavActive
              ? 'bg-[#5865F2] text-white rounded-2xl'
              : 'bg-[var(--dc-bg-card)] text-[var(--dc-text-secondary)] rounded-full hover:rounded-2xl hover:bg-[var(--dc-bg-elevated)] hover:text-[var(--dc-text-primary)]'
          }`}
        >
          <Star className="w-5 h-5 fill-current" />
        </button>
      </div>

      {/* Server Icons */}
      {servers.map((srv) => {
        const isActive = activeContext.type === 'server' && activeContext.serverId === srv.id;
        return (
          <div key={srv.id} className="relative w-full flex items-center justify-center group">
            {isActive ? (
              <span className="absolute left-0 w-1 h-9 bg-white rounded-r-full transition-all duration-200" />
            ) : srv.hasUnread ? (
              <span className="absolute left-0 w-1 h-2 bg-white rounded-r-full group-hover:h-5 transition-all duration-200" />
            ) : null}

            <button
              onClick={() => onSelectServer(srv.id)}
              title={srv.name}
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
                <span className="absolute -top-1 -right-1 w-[19px] h-[19px] rounded-full bg-[var(--dc-bg-card)] text-[var(--dc-text-primary)] flex items-center justify-center border-2 border-[var(--dc-bg-rail)] shadow">
                  <CalendarDays className="w-2.5 h-2.5" />
                </span>
              )}

              {typeof srv.badgeCount === 'number' && srv.badgeCount > 0 && (
                <span className="absolute -bottom-1 -right-1 min-w-[21px] h-[20px] px-1 rounded-full bg-[#da373c] text-white text-[10.5px] font-extrabold tabular-nums flex items-center justify-center border-[2.5px] border-[var(--dc-bg-rail)] leading-none">
                  {srv.badgeCount}
                </span>
              )}
            </button>
          </div>
        );
      })}

      {/* Add Server & Discover */}
      <button
        onClick={onOpenAddServer}
        title="Servidores · Crear o unirse"
        className={`w-12 h-12 rounded-[24px] hover:rounded-[16px] flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 mt-1 ${
          activeContext.type === 'servidores'
            ? 'bg-[#23a55a] text-white rounded-[16px]'
            : 'bg-[var(--dc-bg-card)] hover:bg-[#23a55a] text-[#23a55a] hover:text-white'
        }`}
      >
        <Plus className="w-6 h-6" />
      </button>

      <button
        onClick={onOpenDiscover}
        title="Descubrir servidores"
        className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[var(--dc-bg-card)] hover:bg-[#23a55a] text-[#23a55a] hover:text-white flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 mb-2"
      >
        <Compass className="w-5 h-5" />
      </button>
    </aside>
  );
};
