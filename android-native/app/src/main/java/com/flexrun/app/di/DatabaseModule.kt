package com.flexrun.app.di

import android.content.Context
import androidx.room.Room
import com.flexrun.app.data.local.FlexRunDatabase
import com.flexrun.app.data.local.dao.RunSessionDao
import com.flexrun.app.data.local.dao.UserProfileDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideFlexRunDatabase(
        @ApplicationContext context: Context
    ): FlexRunDatabase {
        return Room.databaseBuilder(
            context,
            FlexRunDatabase::class.java,
            "flexrun_database"
        )
            .fallbackToDestructiveMigration() // For development only
            .build()
    }

    @Provides
    fun provideRunSessionDao(database: FlexRunDatabase): RunSessionDao {
        return database.runSessionDao()
    }

    @Provides
    fun provideUserProfileDao(database: FlexRunDatabase): UserProfileDao {
        return database.userProfileDao()
    }
}
