package com.flexrun.app.data.local.dao

import androidx.room.*
import com.flexrun.app.data.local.entity.RunSessionEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RunSessionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(session: RunSessionEntity)

    @Update
    suspend fun update(session: RunSessionEntity)

    @Delete
    suspend fun delete(session: RunSessionEntity)

    @Query("SELECT * FROM run_sessions WHERE id = :id")
    suspend fun getById(id: String): RunSessionEntity?

    @Query("SELECT * FROM run_sessions ORDER BY startTime DESC")
    fun getAllFlow(): Flow<List<RunSessionEntity>>

    @Query("SELECT * FROM run_sessions ORDER BY startTime DESC LIMIT :limit")
    suspend fun getRecent(limit: Int): List<RunSessionEntity>

    @Query("DELETE FROM run_sessions WHERE id = :id")
    suspend fun deleteById(id: String)
}
