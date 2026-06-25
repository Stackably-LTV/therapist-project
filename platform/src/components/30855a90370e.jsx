"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, User, X } from "lucide-react";
import { Button } from "@/components/2795b661f080";
import { createClient } from "@/components/e7335a071b71";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/2318256b5648";
import { LandingContainer } from "@/components/ed29acce9eae";
import { PsychlinkMark, PsychlinkWordmark } from "@/components/171b48435a24";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/bc12d3573eef";
function UserNav({ userName, userEmail, userRole, profileImageUrl }) {
    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const handleSignOut = () => {
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/api/auth/signout";
        document.body.appendChild(form);
        form.submit();
    };
    return (<DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center h-10 w-10 rounded-full border border-gray-200 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 p-0">
          <Avatar className="h-10 w-10 rounded-full">
            {profileImageUrl && (<AvatarImage src={profileImageUrl} alt={userName} className="object-cover"/>)}
            <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold text-sm rounded-full">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal pb-2">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${userRole}`} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4"/>
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${userRole}/profile`} className="cursor-pointer">
            <User className="mr-2 h-4 w-4"/>
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4"/>
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>);
}
export function LandingNavbar() {
    const supabase = useMemo(() => createClient(), []);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    useEffect(() => {
        let cancelled = false;
        async function load() {
            const { data: { user }, } = await supabase.auth.getUser();
            if (cancelled)
                return;
            if (!user) {
                setUserRole(null);
                setUserName(null);
                setUserEmail(null);
                setProfileImageUrl(null);
                setLoading(false);
                return;
            }
            const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
                supabase.from("user_roles").select("role").eq("id", user.id).maybeSingle(),
                supabase
                    .from("user_profiles")
                    .select("full_name, profile_image_url")
                    .eq("user_id", user.id)
                    .maybeSingle(),
            ]);
            if (cancelled)
                return;
            setUserRole(roleRow?.role ?? null);
            setUserName(profileRow?.full_name ?? null);
            setUserEmail(user.email ?? null);
            setProfileImageUrl(profileRow?.profile_image_url ?? null);
            setLoading(false);
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [supabase]);
    // Only treat as signed-in if user has picked a role; otherwise nav nudges to /login?mode=signup&
    const isSignedIn = !loading && !!userEmail && !!userRole;
    return (<nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <LandingContainer>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <PsychlinkMark className="h-7 w-7 text-primary"/>
            <PsychlinkWordmark className="text-xl"/>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Home
            </Link>
            {userRole === "seeker" && (<Link href="/seeker/therapists" className="text-gray-700 hover:text-primary transition-colors font-medium">
                Clinicians
              </Link>)}
            <Link href="/marketplace" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Marketplace
            </Link>
            <Link href="/therapists" className="text-gray-700 hover:text-primary transition-colors font-medium">
              For Therapists
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Pricing
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary transition-colors font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary transition-colors font-medium">
              Contact
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {!isSignedIn ? (<>
                <Link href="/login?mode=signup&">
                  <Button variant="outline" className="px-5">
                    Sign Up
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="px-5">Sign In</Button>
                </Link>
              </>) : (<UserNav userName={userName || userEmail || "User"} userEmail={userEmail || ""} userRole={userRole || "seeker"} profileImageUrl={profileImageUrl}/>)}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             {isSignedIn && (<UserNav userName={userName || userEmail || "User"} userEmail={userEmail || ""} userRole={userRole || "seeker"} profileImageUrl={profileImageUrl}/>)}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 hover:text-gray-900 focus:outline-none" aria-label="Toggle menu">
              {isMobileMenuOpen ? (<X className="h-6 w-6"/>) : (<div className="space-y-1.5 cursor-pointer">
                    <div className="w-6 h-0.5 bg-gray-600"></div>
                    <div className="w-6 h-0.5 bg-gray-600"></div>
                    <div className="w-6 h-0.5 bg-gray-600"></div>
                </div>)}
            </button>
          </div>
        </div>
      </LandingContainer>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (<div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
          <LandingContainer className="pt-4 pb-6 space-y-3 flex flex-col">
            <Link href="/" className="text-gray-700 hover:text-primary py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
            {userRole === "seeker" && (<Link href="/seeker/therapists" className="text-gray-700 hover:text-primary py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                Clinicians
              </Link>)}
            <Link href="/marketplace" className="text-gray-700 hover:text-primary py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Marketplace
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              About
            </Link>
            <Link href="/therapists" className="text-gray-700 hover:text-primary py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              For Therapists
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-primary py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary py-2 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>

            {!isSignedIn && (<div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">Sign In</Button>
                </Link>
                <Link href="/login?mode=signup&" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center">Sign Up</Button>
                </Link>
              </div>)}
          </LandingContainer>
        </div>)}
    </nav>);
}
