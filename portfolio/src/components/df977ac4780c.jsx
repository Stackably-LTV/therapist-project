import { cn } from "@/components/98e56006aa84";
function Skeleton({ className, ...props }) {
    return (<div className={cn("animate-pulse rounded-md bg-muted", className)} {...props}/>);
}
export { Skeleton };
