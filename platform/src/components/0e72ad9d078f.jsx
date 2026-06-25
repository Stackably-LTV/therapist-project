"use client";
import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { X, Heart, Star, DollarSign, Search, Award, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/2795b661f080";
import { Badge } from "@/components/30348591d689";
import { BookingMatchDialog } from "@/components/725035d851c0";
export function Marketplace({ therapists }) {
    const [cards, setCards] = useState(therapists);
    const [likedTherapists, setLikedTherapists] = useState([]);
    const [matchedTherapist, setMatchedTherapist] = useState(null);
    const [showMatchDialog, setShowMatchDialog] = useState(false);
    const activeCard = cards[cards.length - 1];
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
    const likeOpacity = useTransform(x, [10, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, -10], [1, 0]);
    const handleDragEnd = (event, info) => {
        if (info.offset.x > 100) {
            handleSwipe("right");
        }
        else if (info.offset.x < -100) {
            handleSwipe("left");
        }
    };
    const handleSwipe = (direction) => {
        if (!activeCard)
            return;
        if (direction === "right") {
            setLikedTherapists([...likedTherapists, activeCard.id]);
            setMatchedTherapist(activeCard);
            setShowMatchDialog(true);
        }
        setCards((prev) => prev.slice(0, -1));
    };
    if (!therapists || therapists.length === 0) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center p-8 bg-white border border-gray-200 rounded-lg max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400"/>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Therapists Available</h3>
          <p className="text-gray-600 mb-6">Check back soon for new therapists to connect with.</p>
          <Button asChild>
            <a href="/marketplace/browse">Browse All Therapists</a>
          </Button>
        </div>
      </div>);
    }
    return (<>
      <BookingMatchDialog therapist={matchedTherapist} open={showMatchDialog} onOpenChange={setShowMatchDialog}/>
      
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium mb-4">
            <Heart className="w-4 h-4"/>
            <span>Swipe to Find Your Perfect Match</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Therapist Marketplace
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-3">
            Swipe right to connect, left to pass. Find the therapist who&apos;s right for you.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Prefer a list view?{' '}
            <a href="/marketplace/browse" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">
              Browse all therapists
            </a>
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
              <ArrowLeft className="w-5 h-5 text-red-600"/>
              <span className="font-medium text-red-700">Swipe Left to Pass</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <span className="font-medium text-green-700">Swipe Right to Connect</span>
              <ArrowRight className="w-5 h-5 text-green-600"/>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center">
          <div className="relative w-full max-w-sm h-[650px] flex justify-center items-center">
            {cards.length === 0 ? (<div className="text-center p-8 bg-white border border-gray-200 rounded-lg">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-gray-700"/>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">All Done!</h3>
                <p className="text-gray-600 mb-6">You&apos;ve reviewed all available therapists.</p>
                <div className="space-y-3">
                  <Button onClick={() => setCards(therapists)} variant="outline" className="w-full">
                    Review Again
                  </Button>
                  <Button asChild className="w-full">
                    <a href="/marketplace/browse">Browse All Therapists</a>
                  </Button>
                </div>
              </div>) : (cards.map((card, index) => {
            const isTop = index === cards.length - 1;
            const profile = card.profile_json;
            const specialties = profile?.specialties || [];
            const rate = profile?.rate || 0;
            const bio = profile?.bio || 'Experienced mental health professional';
            const yearsExperience = profile?.years_experience || 0;
            const profileImageUrl = profile?.profile_image_url || '';
            return (<motion.div key={card.id} style={{
                    x: isTop ? x : 0,
                    rotate: isTop ? rotate : 0,
                    opacity: isTop ? opacity : 1 - (cards.length - 1 - index) * 0.05,
                    scale: isTop ? 1 : 1 - (cards.length - 1 - index) * 0.05,
                    zIndex: index,
                }} drag={isTop ? "x" : false} dragConstraints={{ left: 0, right: 0 }} onDragEnd={handleDragEnd} animate={{
                    y: isTop ? 0 : (cards.length - 1 - index) * 10,
                }} className="absolute w-full h-full bg-white rounded-lg overflow-hidden border border-gray-200 cursor-grab active:cursor-grabbing">
                    {isTop && (<>
                        <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 left-6 z-20 border-2 border-green-500 bg-white rounded-lg px-4 py-2 -rotate-12">
                          <span className="text-2xl font-bold text-green-500 uppercase">LIKE</span>
                        </motion.div>
                        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-6 right-6 z-20 border-2 border-red-500 bg-white rounded-lg px-4 py-2 rotate-12">
                          <span className="text-2xl font-bold text-red-500 uppercase">NOPE</span>
                        </motion.div>
                      </>)}

                    <div className="relative h-[320px] w-full bg-gray-200">
                      {profileImageUrl ? (<Image src={profileImageUrl} alt={card.name} fill className="object-cover pointer-events-none" unoptimized/>) : (<div className="w-full h-full flex items-center justify-center">
                          <div className="w-24 h-24 bg-gray-300 rounded-lg flex items-center justify-center">
                            <Award className="w-12 h-12 text-gray-600"/>
                          </div>
                        </div>)}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-6 pt-20 text-white">
                        <h2 className="text-3xl font-bold mb-2">{card.name}</h2>
                        {yearsExperience > 0 && (<div className="flex items-center gap-2 text-white/90">
                            <Clock className="w-5 h-5"/>
                            <span className="text-lg font-medium">{yearsExperience}+ years experience</span>
                          </div>)}
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400"/>
                          <span className="font-bold text-gray-900 text-lg">4.9</span>
                          <span className="text-sm text-gray-500">(120+ reviews)</span>
                        </div>
                        {rate > 0 && (<div className="flex items-center gap-1 bg-gray-100 px-4 py-2 rounded-lg">
                            <DollarSign className="w-5 h-5 text-gray-700"/>
                            <span className="font-bold text-gray-900 text-lg">${rate}/hr</span>
                          </div>)}
                      </div>

                      <p className="text-gray-600 line-clamp-4 text-base leading-relaxed">
                        {bio}
                      </p>

                      {specialties.length > 0 && (<div className="flex flex-wrap gap-2">
                          {specialties.slice(0, 4).map((specialty) => (<Badge key={specialty} className="text-sm px-3 py-1 bg-gray-100 text-gray-700">
                              {specialty}
                            </Badge>))}
                          {specialties.length > 4 && (<Badge variant="outline" className="text-sm px-3 py-1">
                              +{specialties.length - 4}
                            </Badge>)}
                        </div>)}
                    </div>

                    <div className="absolute bottom-6 left-0 right-0 px-6 flex justify-between items-center z-10">
                      <Button size="icon" variant="outline" className="w-14 h-14 rounded-full border-2 border-red-300 text-red-600 hover:bg-red-50" onClick={() => handleSwipe('left')}>
                        <X className="w-6 h-6"/>
                      </Button>
                      


                      <Button size="icon" variant="outline" className="w-14 h-14 rounded-full border-2 border-green-300 text-green-600 hover:bg-green-50" onClick={() => handleSwipe('right')}>
                        <Heart className="w-6 h-6"/>
                      </Button>
                    </div>
                  </motion.div>);
        }))}
          </div>
        </div>
      </div>
      </div>
    </>);
}
