package com.flexrun.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class FlexRunApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize any SDKs or services here
        // TextToSpeech will be initialized when needed
    }
}
