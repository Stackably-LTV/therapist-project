"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeftIcon, LayoutDashboard, Users, Calendar, CreditCard, MessageSquare, Settings, BarChart3, Shield, UserCheck, FolderOpen, LogOut, ChevronUp, FileText, ClipboardList, BellRing } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/components/3dccab7f0b8f";
import { cn } from "@/components/98e56006aa84";
import { Button } from "@/components/2795b661f080";
import { Input } from "@/components/c2f62fb0cb5e";
import { Separator } from "@/components/19cc3f2900f4";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, } from "@/components/c233561f2e64";
import { Skeleton } from "@/components/df977ac4780c";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/943378a021ef";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/2318256b5648";
import { useUnreadCount } from "@/components/8b16d2798643";
import { PsychlinkMark } from "@/components/171b48435a24";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/bc12d3573eef";
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "18rem";
const SIDEBAR_WIDTH_MOBILE = "20rem";
const SIDEBAR_WIDTH_ICON = "5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
const SidebarContext = React.createContext(null);
function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }
    return context;
}
function SidebarProvider({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }) {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback((value) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
            setOpenProp(openState);
        }
        else {
            _setOpen(openState);
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }, [setOpenProp, open]);
    const toggleSidebar = React.useCallback(() => {
        return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
                (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                toggleSidebar();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);
    const state = open ? "expanded" : "collapsed";
    const contextValue = React.useMemo(() => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
    }), [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]);
    return (<SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div data-slot="sidebar-wrapper" style={{
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
        }} className={cn("group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full", className)} {...props}>
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>);
}
function Sidebar({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }) {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
    if (collapsible === "none") {
        return (<div data-slot="sidebar" className={cn("bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col", className)} {...props}>
        {children}
      </div>);
    }
    if (isMobile) {
        return (<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent data-sidebar="sidebar" data-slot="sidebar" data-mobile="true" className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden" style={{
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            }} side={side}>
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>);
    }
    return (<div className="group peer text-sidebar-foreground hidden md:block" data-state={state} data-collapsible={state === "collapsed" ? collapsible : ""} data-variant={variant} data-side={side} data-slot="sidebar">
      <div data-slot="sidebar-gap" className={cn("relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear", "group-data-[collapsible=offcanvas]:w-0", "group-data-[side=right]:rotate-180", variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)")}/>
      <div data-slot="sidebar-container" className={cn("fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex", side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]", variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l", className)} {...props}>
        <div data-sidebar="sidebar" data-slot="sidebar-inner" className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm">
          {children}
        </div>
      </div>
    </div>);
}
function SidebarTrigger({ className, onClick, ...props }) {
    const { toggleSidebar } = useSidebar();
    return (<Button data-sidebar="trigger" data-slot="sidebar-trigger" variant="ghost" size="icon" className={cn("size-7", className)} onClick={(event) => {
            onClick?.(event);
            toggleSidebar();
        }} {...props}>
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>);
}
function SidebarRail({ className, ...props }) {
    const { toggleSidebar } = useSidebar();
    return (<button data-sidebar="rail" data-slot="sidebar-rail" aria-label="Toggle Sidebar" tabIndex={-1} onClick={toggleSidebar} title="Toggle Sidebar" className={cn("hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex", "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize", "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize", "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full", "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2", "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2", className)} {...props}/>);
}
function SidebarInset({ className, ...props }) {
    return (<main data-slot="sidebar-inset" className={cn("bg-background relative flex w-full flex-1 flex-col", "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2", className)} {...props}/>);
}
function SidebarInput({ className, ...props }) {
    return (<Input data-slot="sidebar-input" data-sidebar="input" className={cn("bg-background h-8 w-full shadow-none", className)} {...props}/>);
}
function SidebarHeader({ className, ...props }) {
    return (<div data-slot="sidebar-header" data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props}/>);
}
function SidebarFooter({ className, ...props }) {
    return (<div data-slot="sidebar-footer" data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props}/>);
}
function SidebarSeparator({ className, ...props }) {
    return (<Separator data-slot="sidebar-separator" data-sidebar="separator" className={cn("bg-sidebar-border mx-2 w-auto", className)} {...props}/>);
}
function SidebarContent({ className, ...props }) {
    return (<div data-slot="sidebar-content" data-sidebar="content" className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden", className)} {...props}/>);
}
function SidebarGroup({ className, ...props }) {
    return (<div data-slot="sidebar-group" data-sidebar="group" className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props}/>);
}
function SidebarGroupLabel({ className, asChild = false, ...props }) {
    const Comp = asChild ? Slot : "div";
    return (<Comp data-slot="sidebar-group-label" data-sidebar="group-label" className={cn("text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0", className)} {...props}/>);
}
function SidebarGroupAction({ className, asChild = false, ...props }) {
    const Comp = asChild ? Slot : "button";
    return (<Comp data-slot="sidebar-group-action" data-sidebar="group-action" className={cn("text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "after:absolute after:-inset-2 md:after:hidden", "group-data-[collapsible=icon]:hidden", className)} {...props}/>);
}
function SidebarGroupContent({ className, ...props }) {
    return (<div data-slot="sidebar-group-content" data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props}/>);
}
function SidebarMenu({ className, ...props }) {
    return (<ul data-slot="sidebar-menu" data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props}/>);
}
function SidebarMenuItem({ className, ...props }) {
    return (<li data-slot="sidebar-menu-item" data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props}/>);
}
const sidebarMenuButtonVariants = cva("peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md px-3 text-left text-sm outline-hidden ring-sidebar-ring transition-colors focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0", {
    variants: {
        variant: {
            default: "",
            outline: "bg-background border border-sidebar-border",
        },
        size: {
            default: "h-10",
            sm: "h-9 text-xs",
            lg: "h-11 text-sm group-data-[collapsible=icon]:p-0!",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
function SidebarMenuButton({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }) {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();
    const button = (<Comp data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size={size} data-active={isActive} className={cn(sidebarMenuButtonVariants({ variant, size }), className)} {...props}/>);
    if (!tooltip) {
        return button;
    }
    if (typeof tooltip === "string") {
        tooltip = {
            children: tooltip,
        };
    }
    return (<Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile} {...tooltip}/>
    </Tooltip>);
}
function SidebarMenuAction({ className, asChild = false, showOnHover = false, ...props }) {
    const Comp = asChild ? Slot : "button";
    return (<Comp data-slot="sidebar-menu-action" data-sidebar="menu-action" className={cn("text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0", "after:absolute after:-inset-2 md:after:hidden", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=default]/menu-button:top-1.5", "peer-data-[size=lg]/menu-button:top-2.5", "group-data-[collapsible=icon]:hidden", showOnHover &&
            "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0", className)} {...props}/>);
}
function SidebarMenuBadge({ className, ...props }) {
    return (<div data-slot="sidebar-menu-badge" data-sidebar="menu-badge" className={cn("text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none", "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground", "peer-data-[size=sm]/menu-button:top-1", "peer-data-[size=default]/menu-button:top-1.5", "peer-data-[size=lg]/menu-button:top-2.5", "group-data-[collapsible=icon]:hidden", className)} {...props}/>);
}
function SidebarMenuSkeleton({ className, showIcon = false, ...props }) {
    const width = React.useState(() => {
        return `${Math.floor(Math.random() * 40) + 50}%`;
    })[0];
    return (<div data-slot="sidebar-menu-skeleton" data-sidebar="menu-skeleton" className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)} {...props}>
      {showIcon && (<Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon"/>)}
      <Skeleton className="h-4 max-w-(--skeleton-width) flex-1" data-sidebar="menu-skeleton-text" style={{
            "--skeleton-width": width,
        }}/>
    </div>);
}
function SidebarMenuSub({ className, ...props }) {
    return (<ul data-slot="sidebar-menu-sub" data-sidebar="menu-sub" className={cn("border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5", "group-data-[collapsible=icon]:hidden", className)} {...props}/>);
}
function SidebarMenuSubItem({ className, ...props }) {
    return (<li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" className={cn("group/menu-sub-item relative", className)} {...props}/>);
}
function SidebarMenuSubButton({ asChild = false, size = "md", isActive = false, className, ...props }) {
    const Comp = asChild ? Slot : "a";
    return (<Comp data-slot="sidebar-menu-sub-button" data-sidebar="menu-sub-button" data-size={size} data-active={isActive} className={cn("text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0", "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground", size === "sm" && "text-xs", size === "md" && "text-sm", "group-data-[collapsible=icon]:hidden", className)} {...props}/>);
}
export function DashboardSidebar({ userRole, userName, userEmail, profileImageUrl, therapistFeatures }) {
    const pathname = usePathname();
    const { open } = useSidebar();
    const unreadCount = useUnreadCount();
    const isTherapistUnsubscribed = userRole === 'therapist' && (!therapistFeatures || therapistFeatures.length === 0);
    const [isHydrated, setIsHydrated] = React.useState(false);
    React.useEffect(() => {
        setIsHydrated(true);
    }, []);
    const initials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    const userMenuTrigger = (<SidebarMenuButton size="lg" className={[
            "rounded-md border border-gray-200 hover:bg-gray-50 data-[state=open]:bg-gray-50",
            open ? "p-3 h-auto" : "p-0 h-10 w-10 justify-center",
        ].join(" ")}>
      <div className="flex-shrink-0">
        <Avatar className="h-8 w-8 border border-gray-200">
          {profileImageUrl && (<AvatarImage src={profileImageUrl} alt={userName}/>)}
          <AvatarFallback className="bg-gray-100 text-gray-700 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
      {open && (<>
          <div className="flex-1 overflow-hidden text-left ml-3">
            <p className="text-sm font-semibold truncate text-gray-900">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {userEmail}
            </p>
          </div>
          <ChevronUp className="ml-auto h-4 w-4 text-gray-400"/>
        </>)}
    </SidebarMenuButton>);
    const adminLinks = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Approvals", href: "/admin/approvals", icon: UserCheck },
        { label: "Cancellations", href: "/admin/cancellations", icon: CreditCard },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Compliance", href: "/admin/compliance", icon: Shield },
    ];
    const therapistLinks = [
        ...(isTherapistUnsubscribed ? [] : [{ label: "Dashboard", href: "/therapist", icon: LayoutDashboard }]),
        { label: "Records", href: "/therapist/records?tab=patients", icon: ClipboardList },
        ...(therapistFeatures?.includes('rtc_sessions')
            ? [{ label: "Schedule", href: "/therapist/schedule", icon: Calendar }]
            : []),
        ...(therapistFeatures?.includes('direct_messaging')
            ? [{ label: "Messages", href: "/chat", icon: MessageSquare }]
            : []),
        ...(therapistFeatures?.includes('course_creation')
            ? [{ label: "Courses", href: "/therapist/courses", icon: FolderOpen }]
            : []),
        ...(therapistFeatures?.includes('colleague_consulting')
            ? [{ label: "Community", href: "/therapist/community", icon: Users }]
            : []),
        { label: "Reminders", href: "/therapist/settings/reminders", icon: BellRing },
    ];
    const seekerLinks = [
        { label: "Dashboard", href: "/seeker", icon: LayoutDashboard },
        { label: "Find Therapist", href: "/seeker/therapists", icon: Users },
        { label: "Courses", href: "/seeker/courses", icon: FolderOpen },
        { label: "Care Hub", href: "/seeker/chart", icon: FileText },
        { label: "Messages", href: "/chat", icon: MessageSquare },
    ];
    // Users without a role row are redirected to /login?mode=signup& by middleware,
    // so the sidebar only deals with admin/therapist/seeker.
    const links = userRole === 'admin' ? adminLinks :
        userRole === 'therapist' ? therapistLinks :
            seekerLinks;
    return (<Sidebar collapsible="offcanvas" variant="sidebar" className="border-r border-gray-200 bg-white">
      <SidebarHeader className="py-6">
        <Link href="/" className="flex items-center gap-3 px-3">
          <div className={`flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 ${open ? "h-10 w-10" : "h-9 w-9"}`}>
            <PsychlinkMark className="h-6 w-6 text-gray-900"/>
          </div>
          {open && (<div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                Psychlink.pro
              </div>
              <div className="text-xs text-gray-500 truncate">
                Dashboard
              </div>
            </div>)}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {links.map((link) => {
            // Dashboard root (`/seeker`, `/therapist`, `/admin`) is active
            // ONLY on exact match — otherwise it would highlight on every
            // subroute. Other links are active on exact match OR when the
            // current path is a strict descendant (next char must be `/`,
            // so `/seeker/therapists` doesn't activate a hypothetical
            // `/seeker/therapy` link).
            const isDashboardRoot = link.href === `/${userRole}`;
            const isExact = pathname === link.href;
            const isDescendant = !isDashboardRoot && pathname.startsWith(`${link.href}/`);
            const isActive = isExact || isDescendant;
            return (<SidebarMenuItem key={`${link.label}-${link.href}`}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={link.label} className={[
                    "group rounded-md transition-colors border",
                    isActive
                        ? "bg-gray-900 text-white border-gray-900 hover:bg-gray-900 hover:text-white"
                        : "bg-white text-gray-900 border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300",
                ].join(" ")}>
                      <Link href={link.href} className="flex items-center gap-3 py-2.5">
                        <link.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-500 group-hover:text-gray-900"}`}/>
                        <span className="text-sm font-medium">{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {link.href === "/chat" && unreadCount > 0 ? (<SidebarMenuBadge className={[
                        "right-2 top-2.5 rounded-full px-1.5 h-5 min-w-[20px] text-[10px] font-semibold",
                        isActive
                            ? "bg-white/20 text-white"
                            : "bg-blue-500 text-white",
                    ].join(" ")}>
                        {unreadCount >= 4 ? "4+" : unreadCount}
                      </SidebarMenuBadge>) : null}
                  </SidebarMenuItem>);
        })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div id="sidebar-user-menu">
              {isHydrated ? (<DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    {userMenuTrigger}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="end" className="w-64 p-2 rounded-lg border border-gray-200 bg-white">
                    <DropdownMenuLabel className="p-3">
                      <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-semibold leading-none">{userName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-2"/>
                    {userRole !== 'admin' && (<>
                        <div className="space-y-1">
                          <DropdownMenuItem asChild className="rounded-md focus:bg-gray-50 cursor-pointer">
                            <Link href={`/${userRole}/profile`}>
                              <Settings className="mr-2 h-4 w-4 text-muted-foreground"/>
                              <span>Profile Settings</span>
                            </Link>
                          </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator className="my-2"/>
                      </>)}
                    {userRole === 'seeker' && (<div className="space-y-1">
                        <DropdownMenuItem asChild className="rounded-md focus:bg-gray-50 cursor-pointer">
                          <Link href="/seeker/bookings">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground"/>
                            <span>My Bookings</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-md focus:bg-gray-50 cursor-pointer">
                          <Link href="/seeker/documents">
                            <FolderOpen className="mr-2 h-4 w-4 text-muted-foreground"/>
                            <span>Documents</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2"/>
                      </div>)}
                    {userRole === 'therapist' && (<div className="space-y-1">
                        <DropdownMenuItem asChild className="rounded-md focus:bg-gray-50 cursor-pointer">
                          <Link href="/therapist/billing">
                            <CreditCard className="mr-2 h-4 w-4 text-muted-foreground"/>
                            <span>Billing</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2"/>
                      </div>)}
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-md cursor-pointer" onSelect={(e) => {
                e.preventDefault();
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/api/auth/signout';
                document.body.appendChild(form);
                form.submit();
            }}>
                      <LogOut className="mr-2 h-4 w-4"/>
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>) : (userMenuTrigger)}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>);
}
export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar, };
