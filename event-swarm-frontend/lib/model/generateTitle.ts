export function generateTitle(prompt: string) {
  const text = prompt.toLowerCase()

  const keywords = {
    hackathon: "Hackathon Planning",
    conference: "Conference Organization",
    meetup: "Tech Meetup Setup",
    event: "Event Planning",
    announcement: "Event Announcement",
    speakers: "Speaker Scheduling",
    invitations: "Invitation Campaign",
    marketing: "Marketing Campaign",
    promotion: "Event Promotion",
    schedule: "Schedule Management"
  }

  for (const key in keywords) {
    if (text.includes(key)) {
      return keywords[key as keyof typeof keywords]
    }
  }

  // fallback: first meaningful words
  const words = prompt
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter(w => w.length > 3)

  return words.slice(0, 3).join(" ")
}