package com.whatsappkids.app

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.whatsappkids.app.databinding.ActivityMainBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * v0 stub: Kid mode sends/lists; Parent mode reviews the same inbox.
 * No WhatsApp integration — talks only to services/api.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private var token: String? = null
    private var role: String = "kid"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.modeGroup.setOnCheckedChangeListener { _, checkedId ->
            role = if (checkedId == binding.modeParent.id) "parent" else "kid"
            binding.kidComposer.visibility =
                if (role == "kid") android.view.View.VISIBLE else android.view.View.GONE
            if (role == "parent" && binding.displayName.text.isNullOrBlank()) {
                binding.displayName.setText("Parent")
            }
        }

        binding.loginButton.setOnClickListener { login() }
        binding.sendButton.setOnClickListener { send() }
        binding.refreshButton.setOnClickListener { refresh() }
    }

    private fun apiBase(): String =
        binding.apiBase.text?.toString()?.trim()?.trimEnd('/') ?: "http://10.0.2.2:8787"

    private fun login() {
        val name = binding.displayName.text?.toString()?.trim().orEmpty()
        if (name.isEmpty()) {
            toast("Enter a display name")
            return
        }
        lifecycleScope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    ApiClient.login(apiBase(), role, name)
                }
                token = result.token
                binding.statusText.text =
                    "Signed in as ${result.user.displayName} (${result.user.role})"
                binding.sendButton.isEnabled = role == "kid"
                binding.refreshButton.isEnabled = true
                toast("Logged in")
                refresh()
            } catch (e: Exception) {
                toast(e.message ?: "Login failed")
            }
        }
    }

    private fun send() {
        val t = token ?: return toast("Log in first")
        val body = binding.messageInput.text?.toString()?.trim().orEmpty()
        if (body.isEmpty()) return toast("Type a message")
        lifecycleScope.launch {
            try {
                withContext(Dispatchers.IO) {
                    ApiClient.sendMessage(apiBase(), t, body)
                }
                binding.messageInput.setText("")
                refresh()
            } catch (e: Exception) {
                toast(e.message ?: "Send failed")
            }
        }
    }

    private fun refresh() {
        val t = token ?: return toast("Log in first")
        lifecycleScope.launch {
            try {
                val result = withContext(Dispatchers.IO) {
                    ApiClient.listMessages(apiBase(), t)
                }
                if (result.messages.isEmpty()) {
                    binding.messagesView.text =
                        "Inbox empty (retention ${result.retentionDays} days)"
                } else {
                    binding.messagesView.text = result.messages.joinToString("\n\n") { m ->
                        "${m.senderName} · ${m.createdAt}\n${m.body}"
                    }
                }
            } catch (e: Exception) {
                toast(e.message ?: "Refresh failed")
            }
        }
    }

    private fun toast(msg: String) {
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }
}
