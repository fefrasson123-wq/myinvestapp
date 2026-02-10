import { TrendingUp } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-primary/20 glow-primary">
        <TrendingUp className="w-5 h-5 text-primary" />
      </div>
      <span className="font-display text-lg font-bold text-primary text-glow tracking-tight">
        My Invest
      </span>
    </div>
  );
};

export default Logo;
