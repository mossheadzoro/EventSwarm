export interface Job {
  _id: string
  event_name: string
  event_date: string
  event_type: string
  schedule_csv?: any
  participant_csv?: any
  status: "pending" | "running" | "completed" | "failed"
  created_at: string

  created_by: {
    _id: string
    name: string
    email: string
  }
}