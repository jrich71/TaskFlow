import { 
  users,
  categories,
  tasks,
  activities,
  type User, 
  type InsertUser,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Task,
  type InsertTask,
  type Activity,
  type InsertActivity,
  type TaskWithCategory,
  type UserStats,
  type HeatmapData
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Categories
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Tasks
  getTasks(userId: string, filters?: { categoryId?: number; completed?: boolean; date?: string }): Promise<TaskWithCategory[]>;
  getTask(id: number): Promise<TaskWithCategory | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number): Promise<Task | undefined>;
  
  // Activities
  getUserActivities(userId: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Stats
  getUserStats(userId: string): Promise<UserStats>;
  getHeatmapData(userId: string, startDate: string, endDate: string): Promise<HeatmapData[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Tasks
  async getTasks(userId: string, filters?: { categoryId?: number; completed?: boolean; date?: string }): Promise<TaskWithCategory[]> {
    let whereConditions = [eq(tasks.userId, userId)];

    if (filters?.categoryId) {
      whereConditions.push(eq(tasks.categoryId, filters.categoryId));
    }
    
    if (filters?.completed !== undefined) {
      whereConditions.push(eq(tasks.completed, filters.completed));
    }
    
    if (filters?.date) {
      whereConditions.push(eq(tasks.dueDate, filters.date));
    }

    const results = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        categoryId: tasks.categoryId,
        userId: tasks.userId,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        completed: tasks.completed,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        category: categories,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .where(and(...whereConditions));
    
    return results.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      categoryId: row.categoryId,
      userId: row.userId,
      startDate: row.startDate,
      dueDate: row.dueDate,
      completed: row.completed,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      category: row.category || undefined,
    }));
  }

  async getTask(id: number): Promise<TaskWithCategory | undefined> {
    const [result] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        categoryId: tasks.categoryId,
        userId: tasks.userId,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        completed: tasks.completed,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        category: categories,
      })
      .from(tasks)
      .leftJoin(categories, eq(tasks.categoryId, categories.id))
      .where(eq(tasks.id, id));

    if (!result) return undefined;

    return {
      id: result.id,
      title: result.title,
      description: result.description,
      categoryId: result.categoryId,
      userId: result.userId,
      startDate: result.startDate,
      dueDate: result.dueDate,
      completed: result.completed,
      completedAt: result.completedAt,
      createdAt: result.createdAt,
      category: result.category || undefined,
    };
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async updateTask(id: number, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id));
    return (result.rowCount || 0) > 0;
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ 
        completed: true, 
        completedAt: new Date() 
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) return undefined;
    
    // Update user streak and points
    const user = await this.getUser(task.userId);
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      const lastTaskDate = user.lastTaskDate;
      
      let newStreak = user.currentStreak || 0;
      if (lastTaskDate !== today) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (lastTaskDate === yesterday) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
      
      await this.updateUser(task.userId, {
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak || 0, newStreak),
        totalPoints: (user.totalPoints || 0) + 1,
        lastTaskDate: today,
      });
    }
    
    return task;
  }

  async getUserActivities(userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp));
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    return activity;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await this.getUser(userId);
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, userId));
    
    const today = new Date().toISOString().split('T')[0];
    const tasksToday = userTasks.filter(t => t.dueDate === today && !t.completed).length;
    
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    });
    const upcomingTasks = userTasks.filter(t => 
      t.dueDate && next7Days.includes(t.dueDate) && !t.completed
    ).length;
    
    return {
      tasksToday,
      upcomingTasks,
      currentStreak: user?.currentStreak || 0,
      totalPoints: user?.totalPoints || 0,
    };
  }

  async getHeatmapData(userId: string, startDate: string, endDate: string): Promise<HeatmapData[]> {
    // Get all completed tasks for the user (without date filtering first to debug)
    const userTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.completed, true)
        )
      );
    
    console.log('All completed tasks for user:', userTasks.map(t => ({ 
      id: t.id, 
      title: t.title, 
      completedAt: t.completedAt 
    })));
    
    const dateMap = new Map<string, number>();
    
    // Filter tasks by date range and count them
    userTasks.forEach(task => {
      if (task.completedAt) {
        const completedDateStr = task.completedAt.toISOString().split('T')[0];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const completedDate = new Date(completedDateStr);
        
        console.log('Checking task:', task.title, 'completed on:', completedDateStr, 'range:', startDate, 'to', endDate);
        
        // Check if the completion date falls within our range
        if (completedDate >= start && completedDate <= end) {
          console.log('Task', task.title, 'is within range, adding to count');
          dateMap.set(completedDateStr, (dateMap.get(completedDateStr) || 0) + 1);
        } else {
          console.log('Task', task.title, 'is NOT within range');
        }
      }
    });
    
    console.log('Date map for range', startDate, 'to', endDate, ':', Object.fromEntries(dateMap));
    
    const result: HeatmapData[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: dateMap.get(dateStr) || 0,
      });
    }
    
    console.log('Final heatmap result:', result);
    return result;
  }
}

export const storage = new DatabaseStorage();