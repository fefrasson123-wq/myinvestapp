import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useValuesVisibility } from '@/contexts/ValuesVisibilityContext';
import { cn } from '@/lib/utils';

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  showValues,
  formatCurrency 
}: { 
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  showValues: boolean;
  formatCurrency: (value: number) => string;
}) {
  const timeAgo = getTimeAgo(new Date(notification.created_at));
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dividend':
        return '💰';
      case 'rent':
        return '🏠';
      case 'interest':
        return '📈';
      default:
        return '🔔';
    }
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        notification.is_read 
          ? "bg-background/50 border-border/50" 
          : "bg-primary/5 border-primary/20"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{getTypeIcon(notification.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              "text-sm font-medium truncate",
              !notification.is_read && "text-primary"
            )}>
              {notification.title}
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                  }}
                  title="Marcar como lida"
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Remover"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            {notification.amount > 0 && (
              <span className="text-xs font-mono text-success">
                {showValues ? `+${formatCurrency(notification.amount)}` : '•••••'}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAll 
  } = useNotifications();
  const { showValues, formatCurrencyValue } = useValuesVisibility();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative bg-secondary/50 hover:bg-secondary transition-colors"
          title="Notificações"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-destructive rounded-full animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todas
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="w-3 h-3" />
                Limpar
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Você receberá alertas quando seus ativos pagarem dividendos
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                  showValues={showValues}
                  formatCurrency={formatCurrencyValue}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
