package com.whatsappkids.app

import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Tiny HTTP client for the v0 scaffold API.
 * Uses HttpURLConnection only — no third-party networking stack yet.
 */
object ApiClient {

    data class User(val id: String, val role: String, val displayName: String)
    data class Message(
        val id: String,
        val senderName: String,
        val body: String,
        val createdAt: String
    )
    data class LoginResult(val token: String, val user: User)
    data class ListResult(val messages: List<Message>, val retentionDays: Int)

    fun login(apiBase: String, role: String, displayName: String): LoginResult {
        val payload = JSONObject()
            .put("role", role)
            .put("displayName", displayName)
        val json = request("POST", "$apiBase/auth/login", body = payload.toString())
        val userJson = json.getJSONObject("user")
        return LoginResult(
            token = json.getString("token"),
            user = User(
                id = userJson.getString("id"),
                role = userJson.getString("role"),
                displayName = userJson.getString("displayName")
            )
        )
    }

    fun sendMessage(apiBase: String, token: String, body: String): Message {
        val payload = JSONObject().put("body", body)
        val json = request(
            "POST",
            "$apiBase/messages",
            token = token,
            body = payload.toString()
        )
        return Message(
            id = json.getString("id"),
            senderName = json.getString("senderName"),
            body = json.getString("body"),
            createdAt = json.getString("createdAt")
        )
    }

    fun listMessages(apiBase: String, token: String): ListResult {
        val json = request("GET", "$apiBase/messages", token = token)
        val arr: JSONArray = json.getJSONArray("messages")
        val messages = buildList {
            for (i in 0 until arr.length()) {
                val m = arr.getJSONObject(i)
                add(
                    Message(
                        id = m.getString("id"),
                        senderName = m.getString("senderName"),
                        body = m.getString("body"),
                        createdAt = m.getString("createdAt")
                    )
                )
            }
        }
        return ListResult(
            messages = messages,
            retentionDays = json.optInt("retentionDays", 30)
        )
    }

    private fun request(
        method: String,
        url: String,
        token: String? = null,
        body: String? = null
    ): JSONObject {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 8_000
            readTimeout = 8_000
            setRequestProperty("Accept", "application/json")
            if (token != null) {
                setRequestProperty("Authorization", "Bearer $token")
            }
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                OutputStreamWriter(outputStream).use { it.write(body) }
            }
        }
        val code = conn.responseCode
        val stream = if (code in 200..299) conn.inputStream else conn.errorStream
        val text = stream?.bufferedReader()?.use(BufferedReader::readText).orEmpty()
        conn.disconnect()
        val json = if (text.isBlank()) JSONObject() else JSONObject(text)
        if (code !in 200..299) {
            throw IllegalStateException(json.optString("error", "HTTP $code"))
        }
        return json
    }
}
