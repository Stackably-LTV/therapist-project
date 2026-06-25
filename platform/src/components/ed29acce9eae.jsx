import { cn } from "@/components/98e56006aa84";
export function LandingContainer({ children, className, }) {
    return (<div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>);
}
