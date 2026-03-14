import mongoose from "mongoose"

const JobSchema = new mongoose.Schema({
 event_name: String,
 event_date: String,
 event_type: String,
schedule_csv: {
 type: Buffer
},
participant_csv: {
 type: Buffer
},
status: {
 type: String,
 default: "pending"
},
thread_id: {
    type: String,
    required: false, // Optional until they click Execute
  },
 created_at: {
  type: Date,
  default: Date.now
 },
 created_by:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
 }
})

export default mongoose.models.Job ||
 mongoose.model("Job", JobSchema)