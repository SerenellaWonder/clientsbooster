type DashboardHeaderProps = {
  title: string;
  subtitle: string;
};

export default function DashboardHeader({
  title,
  subtitle,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0d5b82]">
        {subtitle}
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-[#0b1220]">
        {title}
      </h1>
    </div>
  );
}