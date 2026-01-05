const { initializeDatabase } = require("./db/db.connect");
const mongoose = require("mongoose");
const SalesAgent = require("./models/agent.model");
const Comments = require("./models/comment.model");
const Lead = require("./models/lead.model");
const Tags = require("./models/tags.model");
initializeDatabase();

const express = require("express");
const app = express();
app.use(express.json());

const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Server is working");
});

const postLead = async (newLead) => {
  try {
    const saveLead = new Lead(newLead);
    const saveLeads = await saveLead.save();
    return saveLeads;
  } catch (error) {
    console.log(`Error occured while posting Lead: ${error}`);
  }
};

app.post("/V1/leads", async (req, res) => {
  try {
    const saveLeads = await postLead(req.body);
    if (saveLeads) {
      res.status(200).json(saveLeads);
    }
  } catch (error) {
    res.status(500).json({ error: `Error occured while posting: ${error}` });
  }
});

const postAgent = async (newAgent) => {
  try {
    const saveAgent = new SalesAgent(newAgent);
    const saveAgents = await saveAgent.save();
    return saveAgents;
  } catch (error) {
    console.log("Error occured while posting", error);
  }
};

app.post("/V1/agents", async (req, res) => {
  try {
    const saveAgents = await postAgent(req.body);
    if (saveAgents) {
      res.status(200).json(saveAgents);
    }
  } catch (error) {
    res.status(500).json({ Error: `Error occured while posting: ${error}` });
  }
});

const postTag = async (newTag) => {
  try {
    const saveTag = new Tags(newTag);
    const saveTags = await saveTag.save();
    return saveTags;
  } catch (error) {
    console.log("Error occured while posting: ", error);
  }
};

app.post("/V1/tags", async (req, res) => {
  try {
    const saveTags = await postTag(req.body);
    if (saveTags) {
      res.status(200).json(saveTags);
    }
  } catch (error) {
    res
      .status(500)
      .json({ Error: `Error occured while posting tags: ${error}` });
  }
});

const postComments = async (leadId, newComment) => {
  try {
    const getleadById = await Lead.findById(leadId);
    if (!getleadById) {
      console.log(`Error: No Lead with ${leadId} exists`);
    }
    const getAuthorById = await SalesAgent.findById(newComment.author);
    if (!getAuthorById) {
      console.log(`Error: No author exist with this Id`);
    }
    const postComment = new Comments({
      lead: leadId,
      author: newComment.author,
      commentText: newComment.commentText,
    });
    const saveComment = await postComment.save();
    return saveComment;
  } catch (error) {
    console.log("Error occured while posting: ", error);
  }
};

app.post("/V1/leads/:id/comments", async (req, res) => {
  try {
    const saveComment = await postComments(req.params.id, req.body);
    if (saveComment) {
      res.status(200).json(saveComment);
    }
  } catch (error) {
    res
      .status(500)
      .json({ Error: `Error occured while posting comments: ${error}` });
  }
});

const getAgents = async () => {
  try {
    const getAgent = await SalesAgent.find();
    return getAgent;
  } catch (error) {
    console.log("Error while fetching: ", error);
  }
};

app.get("/V1/agents", async (req, res) => {
  try {
    const getAgent = await getAgents();
    if (getAgent?.length) {
      res.status(200).json(getAgent);
    } else {
      res.status(404).json({ Error: "Agents not found" });
    }
  } catch (error) {
    res.status(500).json({ Error: `Error occured while fetching: ${error}` });
  }
});

const getTags = async () => {
  try {
    const readTags = await Tags.find();
    return readTags;
  } catch (error) {
    console.log("Error occured while fetching tags: ", error);
  }
};

app.get("/V1/tags", async (req, res) => {
  try {
    const readTags = await getTags();
    if (readTags?.length) {
      res.status(200).json(readTags);
    } else {
      res.status(404).json({ Error: "Tags not found" });
    }
  } catch (error) {
    res.status(500).json({ Error: `Error while fetching tags: ${error}` });
  }
});

const getLeads = async () => {
  try {
    const readLeads = await Lead.find().populate("salesAgent").populate("tags");
    return readLeads;
  } catch (error) {
    console.log("Error occured while fetching: ", error);
  }
};

app.get("/V1/lead", async (req, res) => {
  try {
    const readLeads = await getLeads();
    if (readLeads?.length) {
      res.status(200).json(readLeads);
    } else {
      res.status(404).json({ Error: "Leads not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ Error: `Error occured while fetching leads: ${error}` });
  }
});

const getLeadsByFilter = async (filteredLeads) => {
  try {
    const getLeads = await Lead.find(filteredLeads)
      .populate("salesAgent")
      .populate("tags");
    return getLeads;
  } catch (error) {
    console.log(`Error occured while fetching leads: ${error}`);
  }
};

app.get("/V1/leads", async (req, res) => {
  const filters = {};
  if (req.query.salesAgent) {
    filters.salesAgent = new mongoose.Types.ObjectId(req.query.salesAgent);
  }
  if (req.query.status) {
    filters.status = req.query.status;
  }
  if (req.query.source) {
    filters.source = req.query.source;
  }
  if (req.query.tags) {
    filters.tags = new mongoose.Types.ObjectId(req.query.tags);
  }
  console.log("Filters: ", filters);
  try {
    console.log("Filters: ", filters);
    const getLeads = await getLeadsByFilter(filters);
    if (getLeads) {
      res.status(200).json(getLeads);
    } else {
      res.status(404).json({ Error: "Leads not found" });
    }
  } catch (error) {
    res.status(500).json({ Error: "Error occured while fetching leads" });
  }
});

const getLastReport = async () => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const getLastLeeds = await Lead.find({
      status: "Closed",
      updatedAt: { $gte: weekAgo },
    })
      .populate("salesAgent")
      .populate("tags");
    return getLastLeeds;
  } catch (error) {
    console.log("Error occured while fetching leads", error);
  }
};

app.get("/V1/report/last-week", async (req, res) => {
  try {
    const getLastLeeds = await getLastReport();
    if (getLastLeeds?.length) {
      res
        .status(200)
        .json({ totalLeadsClosed: getLastLeeds.length, leads: getLastLeeds });
    } else {
      res.status(404).json({ message: "No leads closed last week" });
    }
  } catch (error) {
    res.status(500).json({ Error: "Error occured while fetching leads" });
  }
});

const readPipeline = async () => {
  try {
    const pipelineCount = await Lead.countDocuments({
      status: { $ne: "Closed" },
    });
    return pipelineCount;
  } catch (error) {
    console.log("Error occured while fetching pipeline count", error);
  }
};

app.get("/V1/report/pipeline", async (req, res) => {
  try {
    const pipelineCount = await readPipeline();
    if (pipelineCount) {
      res.status(200).json({
        totalPipelineLeads: pipelineCount,
      });
    } else {
      res.status(404).json({ error: "Pipeline count not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while fetching pipeline count: ${error}` });
  }
});

const getComments = async (leadId) => {
  try {
    const readComments = await Comments.find({ lead: leadId })
      .populate("lead")
      .populate("author");
    return readComments;
  } catch (error) {
    console.log("Error occured while fetching: ", error);
  }
};

app.get("/V1/leads/:id/comments", async (req, res) => {
  try {
    const readComments = await getComments(req.params.id);
    if (readComments) {
      res.status(200).json(readComments);
    } else {
      res.status(404).json({ Error: `Comments not found` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ Error: `Error occured while posting comments: ${error}` });
  }
});

const getAllComments = async () => {
  try {
    const readComments = await Comments.find();
    return readComments;
  } catch (error) {
    console.log("Error occured while fetching comments", error);
  }
};

app.get("/V1/leads/comments", async () => {
  try {
    const readComments = await getAllComments();
    if (readComments.length) {
      res.status(200).json(readComments);
    } else {
      res.status(404).json({ error: "No comments exist" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while fetching comments: ${error}` });
  }
});

const updateLeads = async (leadId, leadToUpdate) => {
  try {
    const updatedLeads = await Lead.findByIdAndUpdate(leadId, leadToUpdate, {
      new: true,
    })
      .populate("salesAgent")
      .populate("tags");
    return updatedLeads;
  } catch (error) {
    console.log("Error occured while updating", error);
  }
};

app.post("/V1/leads/:leadId", async (req, res) => {
  try {
    const leadsUpdated = await updateLeads(req.params.leadId, req.body);
    if (leadsUpdated) {
      res
        .status(200)
        .json({ message: "Lead updated successfully", lead: leadsUpdated });
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while updating leads: ${error}` });
  }
});

const updateAgent = async (agentId, agentToUpdate) => {
  try {
    const updatedAgent = await SalesAgent.findByIdAndUpdate(
      agentId,
      agentToUpdate,
      { new: true }
    );
    return updatedAgent;
  } catch (error) {
    console.log("Error occured while updating agents", error);
  }
};

app.post("/V1/agents/:agentId", async (req, res) => {
  try {
    const updatedAgent = await updateAgent(req.params.agentId, req.body);
    if (updatedAgent) {
      res
        .status(200)
        .json({ message: "Agents updated successfully", Agent: updatedAgent });
    } else {
      res.status(404).json({ error: "Agent not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while updating agents: ${error}` });
  }
});

const updateComments = async (commentId, updatedComment) => {
  try {
    const updatedComments = await Comments.findByIdAndUpdate(
      commentId,
      updatedComment,
      { new: true }
    );
    return updatedComments;
  } catch (error) {
    console.log(`Error occured while updating comments: ${error}`);
  }
};

app.post("/V1/comments/:commentsId", async (req, res) => {
  try {
    const updateComment = await updateComments(req.params.commentsId, req.body)
      .populate("lead")
      .populate("author");
    if (updateComment) {
      res.status(200).json(updateComment);
    } else {
      res.status(404).json({ error: `No comments found` });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while updating comments: ${error}` });
  }
});

const deleteLeads = async (leadId) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(leadId);
    return deletedLead;
  } catch (error) {
    console.log("Error occured while deleting Leads", error);
  }
};

app.delete("/V1/leads/:leadId", async (req, res) => {
  try {
    const deletedLead = await deleteLeads(req.params.leadId);
    if (deletedLead) {
      res
        .status(200)
        .json({ message: "Lead is deleted successfully", lead: deletedLead });
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while deleting leads: ${error}` });
  }
});

const deleteAgent = async (agentId) => {
  try {
    const deletedAgent = await SalesAgent.findByIdAndDelete(agentId);
    return deletedAgent;
  } catch (error) {
    console.log("Error occured while deleting agent", error);
  }
};

app.delete("/V1/agents/:agentId", async (req, res) => {
  try {
    const deletedAgent = await deleteAgent(req.params.agentId);
    if (deletedAgent) {
      res
        .status(200)
        .json({ message: "Agent deleted successfully", agent: deletedAgent });
    } else {
      res.status(404).json({ error: "Agent not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while deleting agent: ${error}` });
  }
});

const deleteComments = async (commentId) => {
  try {
    const deletedComments = await Comments.findByIdAndDelete(commentId);
    return deletedComments;
  } catch (error) {
    console.log("Error occured while deleting comments", error);
  }
};

app.delete("/V1/comments/:commentId", async (req, res) => {
  try {
    const deletedComments = await deleteComments(req.params.commentId);
    if (deletedComments) {
      res.status(200).json({
        message: "Comment deleted successfully",
        comment: deletedComments,
      });
    } else {
      res.status(404).json({ error: "Comments not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while deleting comments: ${error}` });
  }
});

const deleteTags = async (tagId) => {
  try {
    const deletedTags = await Tags.findByIdAndDelete(tagId);
    return deletedTags;
  } catch (error) {
    console.log("Error occured while deleting Tags: ", error);
  }
};

app.delete("/V1/tags/:tagId", async (req, res) => {
  try {
    const deletedTags = await deleteTags(req.params.tagId);
    if (deleteTags) {
      res.status(200).json({ message: "The tag is deleted sucessfully" });
    } else {
      res.status(404).json({ error: "Tag not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error occured while deleting the tag: ${error}` });
  }
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("The server is running on port: ", PORT);
});
