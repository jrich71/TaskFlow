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
    return result.rowCount > 0;
  }

  // Tasks
  async getTasks(userId: string, filters?: { categoryId?: number; completed?: boolean; date?: string }): Promise<TaskWithCategory[]> {
    let query = db
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
      .where(eq(tasks.userId, userId));

    if (filters?.categoryId) {
      query = query.where(and(eq(tasks.userId, userId), eq(tasks.categoryId, filters.categoryId)));
    }
    
    if (filters?.completed !== undefined) {
      query = query.where(and(eq(tasks.userId, userId), eq(tasks.completed, filters.completed)));
    }
    
    if (filters?.date) {
      query = query.where(and(eq(tasks.userId, userId), eq(tasks.dueDate, filters.date)));
    }

    const results = await query;
    
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
    return result.rowCount > 0;
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
    const userTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.completed, true),
          gte(tasks.completedAt, new Date(startDate)),
          lte(tasks.completedAt, new Date(endDate))
        )
      );
    
    const dateMap = new Map<string, number>();
    
    userTasks.forEach(task => {
      if (task.completedAt) {
        const date = task.completedAt.toISOString().split('T')[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });
    
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
    
    return result;
  }
}

  private seedData() {
    // Seed user
    const user = this.createUserSync({
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@example.com",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b093?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
      currentStreak: 7,
      longestStreak: 14,
      totalPoints: 150,
      lastTaskDate: new Date().toISOString().split('T')[0], // Today
    });

    // Seed categories
    const workCategory = this.createCategorySync({
      name: "Work",
      color: "#3B82F6", // Blue
      userId: user.id,
    });

    const personalCategory = this.createCategorySync({
      name: "Personal",
      color: "#10B981", // Green
      userId: user.id,
    });

    const healthCategory = this.createCategorySync({
      name: "Health",
      color: "#F59E0B", // Amber
      userId: user.id,
    });

    const learningCategory = this.createCategorySync({
      name: "Learning",
      color: "#8B5CF6", // Purple
      userId: user.id,
    });

    // Seed tasks
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Today's tasks
    this.createTaskSync({
      title: "Review project proposal",
      description: "Go through the Q4 proposal and provide feedback",
      categoryId: workCategory.id,
      userId: user.id,
      startDate: today,
      dueDate: today,
      completed: true,
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    });

    this.createTaskSync({
      title: "Morning workout",
      description: "30-minute cardio session",
      categoryId: healthCategory.id,
      userId: user.id,
      startDate: today,
      dueDate: today,
      completed: true,
      completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    });

    this.createTaskSync({
      title: "Call dentist for appointment",
      description: "Schedule cleaning appointment for next month",
      categoryId: personalCategory.id,
      userId: user.id,
      startDate: today,
      dueDate: today,
      completed: false,
    });

    // Tomorrow's tasks
    this.createTaskSync({
      title: "Team standup meeting",
      description: "Daily team sync at 9:00 AM",
      categoryId: workCategory.id,
      userId: user.id,
      startDate: tomorrow,
      dueDate: tomorrow,
      completed: false,
    });

    this.createTaskSync({
      title: "Grocery shopping",
      description: "Buy ingredients for weekend dinner party",
      categoryId: personalCategory.id,
      userId: user.id,
      startDate: tomorrow,
      dueDate: tomorrow,
      completed: false,
    });

    // Next week's tasks
    this.createTaskSync({
      title: "Complete React course module",
      description: "Finish the advanced hooks chapter",
      categoryId: learningCategory.id,
      userId: user.id,
      startDate: nextWeek,
      dueDate: nextWeek,
      completed: false,
    });

    this.createTaskSync({
      title: "Quarterly review presentation",
      description: "Prepare slides for Q4 performance review",
      categoryId: workCategory.id,
      userId: user.id,
      startDate: nextWeek,
      dueDate: nextWeek,
      completed: false,
    });

    // Seed user activities
    this.createActivitySync({
      userId: user.id,
      text: "Completed 'Review project proposal' task",
      type: "task_completed",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });

    this.createActivitySync({
      userId: user.id,
      text: "Completed 'Morning workout' task",
      type: "task_completed",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    });

    this.createActivitySync({
      userId: user.id,
      text: "Reached 7-day streak milestone!",
      type: "streak_milestone",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    this.createActivitySync({
      userId: user.id,
      text: "Created new category 'Learning'",
      type: "category_created",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });
  }

  private createUserSync(user: InsertUser): User {
    const id = this.currentId.users++;
    const newUser: User = { 
      ...user, 
      id,
      profileImage: user.profileImage || null,
      currentStreak: user.currentStreak || null,
      longestStreak: user.longestStreak || null,
      totalPoints: user.totalPoints || null,
      lastTaskDate: user.lastTaskDate || null
    };
    this.users.set(id, newUser);
    return newUser;
  }

  private createCategorySync(category: InsertCategory): Category {
    const id = this.currentId.categories++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  private createTaskSync(task: InsertTask): Task {
    const id = this.currentId.tasks++;
    const newTask: Task = { 
      ...task, 
      id,
      createdAt: new Date(),
      description: task.description || null,
      categoryId: task.categoryId || null,
      startDate: task.startDate || null,
      dueDate: task.dueDate || null,
      completed: task.completed || null,
      completedAt: task.completedAt || null
    };
    this.tasks.set(id, newTask);
    return newTask;
  }

  private createActivitySync(activity: InsertActivity): Activity {
    const id = this.currentId.activities++;
    const newActivity: Activity = { 
      ...activity, 
      id,
      timestamp: activity.timestamp || new Date()
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    return this.createUserSync(user);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Categories
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(c => c.userId === userId);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    return this.createCategorySync(category);
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;
    
    const updatedCategory = { ...existingCategory, ...category };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Tasks
  async getTasks(userId: number, filters?: { categoryId?: number; completed?: boolean; date?: string }): Promise<TaskWithCategory[]> {
    let userTasks = Array.from(this.tasks.values()).filter(t => t.userId === userId);
    
    if (filters?.categoryId) {
      userTasks = userTasks.filter(t => t.categoryId === filters.categoryId);
    }
    
    if (filters?.completed !== undefined) {
      userTasks = userTasks.filter(t => t.completed === filters.completed);
    }
    
    if (filters?.date) {
      userTasks = userTasks.filter(t => t.dueDate === filters.date);
    }
    
    return userTasks.map(task => {
      const category = task.categoryId ? this.categories.get(task.categoryId) : undefined;
      return {
        ...task,
        category,
      };
    });
  }

  async getTask(id: number): Promise<TaskWithCategory | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const category = task.categoryId ? this.categories.get(task.categoryId) : undefined;
    return {
      ...task,
      category,
    };
  }

  async createTask(task: InsertTask): Promise<Task> {
    return this.createTaskSync(task);
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const completedTask = { 
      ...task, 
      completed: true, 
      completedAt: new Date() 
    };
    this.tasks.set(id, completedTask);
    
    // Update user streak and points
    const user = this.users.get(task.userId);
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
      
      const updatedUser = {
        ...user,
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak || 0, newStreak),
        totalPoints: (user.totalPoints || 0) + 1,
        lastTaskDate: today,
      };
      this.users.set(task.userId, updatedUser);
    }
    
    return completedTask;
  }

  async getUserActivities(userId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    return this.createActivitySync(activity);
  }

  async getUserStats(userId: number): Promise<UserStats> {
    const user = this.users.get(userId);
    const tasks = Array.from(this.tasks.values()).filter(t => t.userId === userId);
    
    const today = new Date().toISOString().split('T')[0];
    const tasksToday = tasks.filter(t => t.dueDate === today && !t.completed).length;
    
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    });
    const upcomingTasks = tasks.filter(t => 
      t.dueDate && next7Days.includes(t.dueDate) && !t.completed
    ).length;
    
    return {
      tasksToday,
      upcomingTasks,
      currentStreak: user?.currentStreak || 0,
      totalPoints: user?.totalPoints || 0,
    };
  }

  async getHeatmapData(userId: number, startDate: string, endDate: string): Promise<HeatmapData[]> {
    const tasks = Array.from(this.tasks.values()).filter(t => 
      t.userId === userId && t.completed && t.completedAt
    );
    
    const dateMap = new Map<string, number>();
    
    tasks.forEach(task => {
      if (task.completedAt) {
        const date = task.completedAt.toISOString().split('T')[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });
    
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
    
    return result;
  }
}

export const storage = new MemStorage();
