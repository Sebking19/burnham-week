import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PushNotificationManager({ user }) {
  const [permissionState, setPermissionState] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [subRecord, setSubRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermissionState(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    // Load existing subscription record
    base44.entities.PushSubscription.filter({ user_email: user.email }, '', 1)
      .then(records => {
        if (records.length > 0) {
          setSubRecord(records[0]);
          setEnabled(records[0].enabled !== false); // default true if exists
        }
      })
      .catch(() => {});
  }, [user]);

  const handleClick = async () => {
    if (!isSupported || loading) return;

    if (permissionState === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    if (permissionState !== 'granted') {
      // Request permission first
      const result = await Notification.requestPermission();
      setPermissionState(result);
      if (result !== 'granted') return;
    }

    setLoading(true);

    // Toggle enabled state
    const newEnabled = !enabled;

    try {
      if (subRecord) {
        await base44.entities.PushSubscription.update(subRecord.id, { enabled: newEnabled });
        setSubRecord(prev => ({ ...prev, enabled: newEnabled }));
      } else {
        // Create a placeholder record to track opted-in state
        const created = await base44.entities.PushSubscription.create({
          user_email: user.email,
          endpoint: 'web-' + user.email,
          p256dh: '',
          auth: '',
          enabled: true,
        });
        setSubRecord(created);
      }
      setEnabled(newEnabled);

      if (newEnabled) {
        new Notification('Otters Alerts Enabled 🚣', {
          body: "You'll now receive alerts for upcoming events and schedule changes.",
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.error('Failed to update notification preference', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) return null;

  const isOn = permissionState === 'granted' && enabled;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border backdrop-blur-xl ${
        permissionState === 'denied'
          ? 'bg-red-500/20 text-red-300 border-red-500/30'
          : isOn
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
          : 'bg-white/20 text-white/70 border-white/30 hover:bg-white/25'
      }`}
      title={
        permissionState === 'denied' ? 'Notifications blocked in browser' :
        isOn ? 'Tap to turn off alerts' :
        'Enable alerts'
      }
    >
      {isOn ? <Bell size={14} /> : <BellOff size={14} />}
      {permissionState === 'denied' ? 'Alerts Blocked' :
       isOn ? 'Alerts On' :
       'Enable Alerts'}
    </button>
  );
}