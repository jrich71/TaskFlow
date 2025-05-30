import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertCategorySchema, insertActivitySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (mock user with ID 1)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user stats
  app.get("/api/user/stats", async (req, res) => {
    try {
      const stats = await storage.getUserStats(1);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  // Get user activities
  app.get("/api/user/activities", async (req, res) => {
    try {
      const activities = await storage.getUserActivities(1);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  // Get heatmap data
  app.get("/api/user/heatmap", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const heatmapData = await storage.getHeatmapData(
        1, 
        startDate as string || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate as string || new Date().toISOString().split('T')[0]
      );
      res.json(heatmapData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get heatmap data" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories(1);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = { ...req.body, userId: 1 };
      const validatedData = insertCategorySchema.parse(categoryData);
      const category = await storage.createCategory(validatedData);
      
      // Create activity
      const activityData = {
        userId: 1,
        text: `Created new category '${category.name}'`,
        type: "category_created" as const,
      };
      const validatedActivity = insertActivitySchema.parse(activityData);
      await storage.createActivity(validatedActivity);
      
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { categoryId, completed, date } = req.query;
      const filters = {
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        completed: completed ? completed === 'true' : undefined,
        date: date as string,
      };
      
      const tasks = await storage.getTasks(1, filters);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = { ...req.body, userId: 1 };
      const validatedData = insertTaskSchema.parse(taskData);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, req.body);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteTask(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.post("/api/tasks/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.completeTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Create activity
      const activityData = {
        userId: 1,
        text: `Completed '${task.title}' task`,
        type: "task_completed" as const,
      };
      const validatedActivity = insertActivitySchema.parse(activityData);
      await storage.createActivity(validatedActivity);
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
