document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and previous options/cards
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">Select an activity</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants ? details.participants.length : 0);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description || ""}</p>
          <p><strong>Schedule:</strong> ${details.schedule || "TBD"}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";
        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsDiv.appendChild(participantsHeading);

        const list = document.createElement("ul");
        list.className = "participant-list";

        const participants = Array.isArray(details.participants) ? details.participants : [];

        if (participants.length === 0) {
          const empty = document.createElement("li");
          empty.textContent = "No participants yet";
          empty.style.color = "#666";
          list.appendChild(empty);
        } else {
          participants.forEach((p) => {
            let displayName = "";
            let avatarEl = null;
            let displayName = "";
            let avatarEl = null;
            let participantEmail = null;

            if (p && typeof p === "object") {
              displayName = p.name || p.email || "Participant";
              participantEmail = p.email || null;
              if (p.avatar) {
                avatarEl = document.createElement("img");
                avatarEl.className = "participant-avatar";
                avatarEl.src = p.avatar;
                avatarEl.alt = displayName;
              }
            } else {
              displayName = String(p);
              // if the participant entry looks like an email, use it
              participantEmail = /@/.test(displayName) ? displayName : null;
            }

            // Fallback avatar with initials
            if (!avatarEl) {
              const initials = displayName
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0].toUpperCase())
                .join("");
              avatarEl = document.createElement("span");
              avatarEl.className = "participant-avatar";
              avatarEl.textContent = initials || "?";
            }

            const li = document.createElement("li");
            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = displayName;

            li.appendChild(avatarEl);
            li.appendChild(nameSpan);

            // Add remove/unregister button if we have an email to target
            if (participantEmail) {
              const removeBtn = document.createElement("button");
              removeBtn.type = "button";
              removeBtn.className = "participant-remove";
              removeBtn.title = "Unregister participant";
              removeBtn.textContent = "✕";
              removeBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                // call unregister endpoint
                try {
                  const resp = await fetch(
                    `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participantEmail)}`,
                    { method: "POST" }
                  );
                  const result = await resp.json();
                  if (resp.ok) {
                    messageDiv.textContent = result.message;
                    messageDiv.className = "success";
                    // refresh list
                    fetchActivities();
                  } else {
                    messageDiv.textContent = result.detail || "Failed to unregister";
                    messageDiv.className = "error";
                  }
                } catch (err) {
                  messageDiv.textContent = "Failed to unregister. Please try again.";
                  messageDiv.className = "error";
                  console.error("Error unregistering:", err);
                }
                messageDiv.classList.remove("hidden");
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 4000);
              });

              // push remove button to the end
              li.appendChild(removeBtn);
            }

            list.appendChild(li);
          });
        }

        participantsDiv.appendChild(list);
        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // refresh activities to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
