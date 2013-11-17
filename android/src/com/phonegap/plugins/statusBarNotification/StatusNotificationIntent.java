
package com.phonegap.plugins.statusBarNotification;

import android.app.Notification;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;

import com.mobak.kassy.R;

public class StatusNotificationIntent {
    public static Notification buildNotification( Context context, CharSequence tag, CharSequence contentTitle, CharSequence contentText, int flag, int when ) {
        int icon = R.drawable.notification;
        Notification noti = new Notification(icon, contentTitle, when);
        noti.flags |= flag;
        noti.defaults |= Notification.DEFAULT_SOUND | Notification.DEFAULT_LIGHTS;
        /*noti.ledARGB = 0xff00ff00;
        noti.ledOnMS = 300;
        noti.ledOffMS = 1000;*/
        
        PackageManager pm = context.getPackageManager();
        
        Intent notificationIntent = pm.getLaunchIntentForPackage(context.getPackageName());
        notificationIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        notificationIntent.putExtra("notificationTag", tag);
        
        PendingIntent contentIntent = PendingIntent.getActivity(context, 0, notificationIntent, 0);
        
        noti.setLatestEventInfo(context, contentTitle, contentText, contentIntent);
        
        return noti;
    }
}