package com.mobak.kassy;

import org.apache.cordova.*;
import android.webkit.WebView;
import android.webkit.SslErrorHandler;
import android.net.http.SslError;
import android.graphics.Bitmap;

public class CustomCordovaWebViewClient extends CordovaWebViewClient {
	 public CustomCordovaWebViewClient(DroidGap ctx) {
	   super(ctx);
	 }
	 
	 @Override
	 public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
	     handler.proceed();
	 }
}
