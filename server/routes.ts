import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertActivitySchema } from "@shared/schema";

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

  // Get all classes with optional filters
  app.get("/api/classes", async (req, res) => {
    try {
      const { language, level, timeOfDay } = req.query;
      const filters = {
        language: language as string,
        level: level as string,
        timeOfDay: timeOfDay as string,
      };
      
      const classes = await storage.getClasses(filters);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get classes" });
    }
  });

  // Get specific class
  app.get("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const classItem = await storage.getClass(id);
      
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      res.json(classItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to get class" });
    }
  });

  // Book a class
  app.post("/api/classes/:id/book", async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const userId = 1; // Mock user ID
      
      const classItem = await storage.getClass(classId);
      if (!classItem) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      if (classItem.currentStudents >= classItem.maxStudents) {
        return res.status(400).json({ message: "Class is full" });
      }
      
      const bookingData = {
        userId,
        classId,
        sessionDate: classItem.nextSession!,
        status: "booked" as const,
      };
      
      const validatedData = insertBookingSchema.parse(bookingData);
      const booking = await storage.createBooking(validatedData);
      
      // Create activity
      const activityData = {
        userId,
        text: `Booked ${classItem.title}`,
        type: "booked" as const,
      };
      
      const validatedActivity = insertActivitySchema.parse(activityData);
      await storage.createActivity(validatedActivity);
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to book class" });
    }
  });

  // Get user bookings
  app.get("/api/user/bookings", async (req, res) => {
    try {
      const bookings = await storage.getUserBookings(1);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bookings" });
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

  // Get all languages
  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get languages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
