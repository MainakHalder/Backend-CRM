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

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("The server is running on port: ", PORT);
});
