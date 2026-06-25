import Image from "next/image";
import { cn } from "@/components/98e56006aa84";
export const SITE_LOGO_PATH = "/therapy.png";
export function PsychlinkMark({ className, title = "Psychlink.pro" }) {
    return (<Image src={SITE_LOGO_PATH} alt={title} width={48} height={48} className={cn(className, "object-contain")} priority/>);
}
export function PsychlinkWordmark({ className, title = 'Psychlink.pro' }) {
    return (<div className={className} aria-label={title}>
      <span className="font-semibold tracking-tight">Psychlink</span>
      <span className="font-semibold tracking-tight text-gray-500">.pro</span>
    </div>);
}
