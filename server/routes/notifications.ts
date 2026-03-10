import express from 'express';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Get notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '50', offset = '0', unread_only = 'false' } = req.query;

    console.log(`🔔 Fetching notifications for user: ${userId}`);

    // First get the user's GHL subaccounts to get location IDs
    const { data: subaccounts, error: subaccountError } = await supabase
      .from('ghl_subaccounts')
      .select('ghl_location_id')
      .eq('firm_user_id', userId);

    if (subaccountError) {
      console.error('❌ Error fetching subaccounts:', subaccountError);
      return res.status(500).json({ 
        error: 'Failed to fetch user subaccounts',
        details: subaccountError.message 
      });
    }

    if (!subaccounts || subaccounts.length === 0) {
      console.log(`ℹ️ No GHL subaccounts found for user: ${userId}`);
      return res.json({
        notifications: [],
        total: 0,
        unread_count: 0,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
    }

    const locationIds = subaccounts.map(sub => sub.ghl_location_id);
    console.log(`📍 Found ${locationIds.length} GHL locations for user`);

    // Build the query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .in('ghl_location_id', locationIds)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    // Filter by unread status if requested
    if (unread_only === 'true') {
      query = query.eq('read_status', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching notifications:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch notifications',
        details: error.message 
      });
    }

    // Count unread notifications
    const { count: unreadCount, error: unreadError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .in('ghl_location_id', locationIds)
      .eq('read_status', false);

    if (unreadError) {
      console.error('❌ Error counting unread notifications:', unreadError);
    }

    console.log(`✅ Found ${notifications?.length || 0} notifications (${unreadCount || 0} unread)`);

    res.json({
      notifications: notifications || [],
      total: count || 0,
      unread_count: unreadCount || 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error: any) {
    console.error('❌ Unexpected error in notifications endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read_status: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('❌ Error marking notification as read:', error);
      return res.status(500).json({ 
        error: 'Failed to mark notification as read',
        details: error.message 
      });
    }

    console.log(`✅ Marked notification ${notificationId} as read`);
    res.json({ success: true });

  } catch (error: any) {
    console.error('❌ Unexpected error marking notification as read:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;

    // First get the user's GHL location IDs
    const { data: subaccounts, error: subaccountError } = await supabase
      .from('ghl_subaccounts')
      .select('ghl_location_id')
      .eq('firm_user_id', userId);

    if (subaccountError) {
      console.error('❌ Error fetching subaccounts:', subaccountError);
      return res.status(500).json({ 
        error: 'Failed to fetch user subaccounts',
        details: subaccountError.message 
      });
    }

    if (!subaccounts || subaccounts.length === 0) {
      console.log(`ℹ️ No GHL subaccounts found for user: ${userId}`);
      return res.json({ success: true, updated: 0 });
    }

    const locationIds = subaccounts.map(sub => sub.ghl_location_id);

    const { error } = await supabase
      .from('notifications')
      .update({ read_status: true, updated_at: new Date().toISOString() })
      .in('ghl_location_id', locationIds)
      .eq('read_status', false);

    if (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return res.status(500).json({ 
        error: 'Failed to mark all notifications as read',
        details: error.message 
      });
    }

    console.log(`✅ Marked all notifications as read for user ${userId}`);
    res.json({ success: true });

  } catch (error: any) {
    console.error('❌ Unexpected error marking all notifications as read:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;
