import mongoose from "mongoose"

const VoiceCommandSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: "pending"
  }
},
{
  timestamps: true
})

export default mongoose.models.VoiceCommand ||
mongoose.model("VoiceCommand", VoiceCommandSchema)