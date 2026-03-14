const express = require("express")
const http = require("http")
const { Server } = require("socket.io")

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

io.on("connection", (socket) => {

  console.log("Client connected:", socket.id)

  // join room (simulate job)
  socket.on("join_job", (jobId) => {
    socket.join(jobId)
    console.log("Joined job:", jobId)
  })

  // simulate agent workflow
  const agents = ["voice","scheduler","content","comms","analytics"]

  let step = 0

  const interval = setInterval(() => {

    const agent = agents[step]

    io.to("job-1").emit("agent_progress", {
      agent,
      progress: Math.floor(Math.random()*100),
      task: getTask(agent),
      status: "running"
    })

    if(step < agents.length-1){

      io.to("job-1").emit("agent_flow", {
        from: agents[step],
        to: agents[step+1]
      })

    }

    step = (step + 1) % agents.length

  },2000)

  socket.on("disconnect", () => {
    clearInterval(interval)
    console.log("Client disconnected")
  })

})

function getTask(agent){

  const tasks = {
    voice: "Parsing command",
    scheduler: "Finding venues",
    content: "Writing announcement",
    comms: "Sending invites",
    analytics: "Tracking RSVPs"
  }

  return tasks[agent]

}

server.listen(4000, () => {
  console.log("Mock socket server running on port 4000")
})