package com.flexrun.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.flexrun.app.data.local.dao.RunSessionDao
import com.flexrun.app.data.local.dao.UserProfileDao
import com.flexrun.app.data.local.entity.RunSessionEntity
import com.flexrun.app.data.local.entity.UserProfileEntity

@Database(
    entities = [
        RunSessionEntity::class,
        UserProfileEntity::class
    ],
    version = 1,
    exportSchema = true
)
@TypeConverters(Converters::class)
abstract class FlexRunDatabase : RoomDatabase() {
    abstract fun runSessionDao(): RunSessionDao
    abstract fun userProfileDao(): UserProfileDao
}
