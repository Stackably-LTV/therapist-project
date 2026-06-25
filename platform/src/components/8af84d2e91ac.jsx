'use client';
import { useState } from 'react';
import { Button } from '@/components/2795b661f080';
import { Card, CardContent } from '@/components/c0ebd3fbafc6';
import { Alert, AlertDescription } from '@/components/f199a80a8c3b';
import { Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import AvailabilityEditor from '@/components/1f135646eb15';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/components/040561496129';
export default function AvailabilitySettings({ user, initialAvailability, profileId, profileJson }) {
    const [availability, setAvailability] = useState(initialAvailability);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const handleSave = async () => {
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            void profileJson;
            await authService.updateProfile(user.id, { availability });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        catch (err) {
            console.error('Failed to save availability:', err);
            setError(err instanceof Error ? err.message : 'Failed to save changes. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Availability Settings</h2>
          <p className="text-gray-500">Manage your weekly schedule for client bookings</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
          {loading ? (<>
              <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
              Saving...
            </>) : (<>
              <Save className="w-4 h-4 mr-2"/>
              Save Changes
            </>)}
        </Button>
      </div>

      <AnimatePresence>
        {success && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600"/>
              <AlertDescription>
                Your availability schedule has been successfully updated.
              </AlertDescription>
            </Alert>
          </motion.div>)}

        {error && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>)}
      </AnimatePresence>

      <Card>
        <CardContent className="pt-6">
          <AvailabilityEditor value={availability} onChange={(newAvailability) => {
            setAvailability(newAvailability);
            if (success)
                setSuccess(false);
        }}/>
        </CardContent>
      </Card>
    </div>);
}
