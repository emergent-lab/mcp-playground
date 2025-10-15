import Link from "next/link";

type NavItemProps = {
  name: string;
  href: string;
  isActive: boolean;
};

export function NavItem({ name, href, isActive }: NavItemProps) {
  return (
    <Link
      className={
        isActive
          ? "flex items-center rounded-full bg-background/80 px-4 py-2.5 transition-all duration-200"
          : "flex items-center rounded-full px-4 py-2.5 opacity-70 transition-all duration-200 hover:bg-background/40 hover:opacity-100"
      }
      href={href}
    >
      <span className="font-medium font-mono text-[0.688rem] uppercase tracking-widest">
        {name}
      </span>
    </Link>
  );
}
