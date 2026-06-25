import { cn } from "@/components/98e56006aa84";
function Skeleton({ className, ...props }) {
    return (<div data-slot="skeleton" className={cn("bg-accent animate-pulse rounded-md", className)} {...props}/>);
}
export { Skeleton };
