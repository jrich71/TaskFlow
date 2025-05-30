import { 
  users, 
  instructors, 
  languages, 
  classes, 
  bookings, 
  activities,
  type User, 
  type InsertUser,
  type Instructor,
  type InsertInstructor,
  type Language,
  type InsertLanguage,
  type Class,
  type InsertClass,
  type Booking,
  type InsertBooking,
  type Activity,
  type InsertActivity,
  type ClassWithDetails,
  type UserStats
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Classes
  getClasses(filters?: { language?: string; level?: string; timeOfDay?: string }): Promise<ClassWithDetails[]>;
  getClass(id: number): Promise<ClassWithDetails | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  
  // Instructors
  getInstructor(id: number): Promise<Instructor | undefined>;
  createInstructor(instructor: InsertInstructor): Promise<Instructor>;
  
  // Languages
  getLanguages(): Promise<Language[]>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  
  // Bookings
  getUserBookings(userId: number): Promise<(Booking & { class: ClassWithDetails })[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  
  // Activities
  getUserActivities(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Stats
  getUserStats(userId: number): Promise<UserStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private instructors: Map<number, Instructor>;
  private languages: Map<number, Language>;
  private classes: Map<number, Class>;
  private bookings: Map<number, Booking>;
  private activities: Map<number, Activity>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.instructors = new Map();
    this.languages = new Map();
    this.classes = new Map();
    this.bookings = new Map();
    this.activities = new Map();
    this.currentId = {
      users: 1,
      instructors: 1,
      languages: 1,
      classes: 1,
      bookings: 1,
      activities: 1,
    };

    this.seedData();
  }

  private seedData() {
    // Seed languages
    const spanish = this.createLanguageSync({ name: "Spanish", code: "es" });
    const french = this.createLanguageSync({ name: "French", code: "fr" });
    const japanese = this.createLanguageSync({ name: "Japanese", code: "ja" });
    const german = this.createLanguageSync({ name: "German", code: "de" });
    const mandarin = this.createLanguageSync({ name: "Mandarin", code: "zh" });

    // Seed instructors
    const carlos = this.createInstructorSync({
      firstName: "Carlos",
      lastName: "Rodriguez",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48",
      rating: "4.9",
      reviewCount: 23,
    });

    const marie = this.createInstructorSync({
      firstName: "Marie",
      lastName: "Dubois",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b093?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48",
      rating: "4.8",
      reviewCount: 31,
    });

    const kenji = this.createInstructorSync({
      firstName: "Kenji",
      lastName: "Tanaka",
      profileImage: "https://images.unsplash.com/photo-1556474835-b0f3ac40d4d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48",
      rating: "5.0",
      reviewCount: 18,
    });

    const anna = this.createInstructorSync({
      firstName: "Anna",
      lastName: "Mueller",
      profileImage: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48",
      rating: "4.7",
      reviewCount: 15,
    });

    const liWei = this.createInstructorSync({
      firstName: "Li",
      lastName: "Wei",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48",
      rating: "4.9",
      reviewCount: 27,
    });

    // Seed classes
    this.createClassSync({
      title: "Spanish Conversation Practice",
      description: "Improve your conversational Spanish skills in a friendly environment",
      instructorId: carlos.id,
      languageId: spanish.id,
      level: "Intermediate",
      duration: 90,
      price: "25.00",
      maxStudents: 8,
      currentStudents: 3,
      distance: "0.8",
      nextSession: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      status: "available",
      rating: "4.9",
      reviewCount: 23,
    });

    this.createClassSync({
      title: "French Grammar Intensive",
      description: "Master French grammar fundamentals",
      instructorId: marie.id,
      languageId: french.id,
      level: "Beginner",
      duration: 120,
      price: "35.00",
      maxStudents: 10,
      currentStudents: 6,
      distance: "1.2",
      nextSession: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow 2PM
      status: "available",
      rating: "4.8",
      reviewCount: 31,
    });

    this.createClassSync({
      title: "Japanese for Beginners",
      description: "Start your Japanese learning journey",
      instructorId: kenji.id,
      languageId: japanese.id,
      level: "Beginner",
      duration: 60,
      price: "30.00",
      maxStudents: 6,
      currentStudents: 2,
      distance: "2.1",
      nextSession: new Date(Date.now() + 50 * 60 * 60 * 1000), // Wed 6:30PM
      status: "few_spots",
      rating: "5.0",
      reviewCount: 18,
    });

    this.createClassSync({
      title: "German Basics",
      description: "Learn German fundamentals",
      instructorId: anna.id,
      languageId: german.id,
      level: "Beginner",
      duration: 75,
      price: "28.00",
      maxStudents: 8,
      currentStudents: 4,
      distance: "1.5",
      nextSession: new Date(Date.now() + 26 * 60 * 60 * 1000), // Thursday 2PM
      status: "available",
      rating: "4.7",
      reviewCount: 15,
    });

    this.createClassSync({
      title: "Mandarin Workshop",
      description: "Intensive Mandarin practice session",
      instructorId: liWei.id,
      languageId: mandarin.id,
      level: "Intermediate",
      duration: 180,
      price: "50.00",
      maxStudents: 12,
      currentStudents: 8,
      distance: "3.2",
      nextSession: new Date(Date.now() + 122 * 60 * 60 * 1000), // Saturday 10AM
      status: "available",
      rating: "4.9",
      reviewCount: 27,
    });

    // Seed user
    const user = this.createUserSync({
      firstName: "Alex",
      lastName: "Chen",
      email: "alex.chen@example.com",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32",
      activeClasses: 3,
      hoursThisWeek: 12,
      streak: 7,
    });

    // Seed user activities
    this.createActivitySync({
      userId: user.id,
      text: "Completed Spanish Conversation class",
      type: "completed",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    });

    this.createActivitySync({
      userId: user.id,
      text: "Booked German Basics for Thursday",
      type: "booked",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    this.createActivitySync({
      userId: user.id,
      text: 'Earned "Week Warrior" achievement',
      type: "achievement",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });
  }

  private createUserSync(user: InsertUser): User {
    const id = this.currentId.users++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  private createInstructorSync(instructor: InsertInstructor): Instructor {
    const id = this.currentId.instructors++;
    const newInstructor: Instructor = { ...instructor, id };
    this.instructors.set(id, newInstructor);
    return newInstructor;
  }

  private createLanguageSync(language: InsertLanguage): Language {
    const id = this.currentId.languages++;
    const newLanguage: Language = { ...language, id };
    this.languages.set(id, newLanguage);
    return newLanguage;
  }

  private createClassSync(classData: InsertClass): Class {
    const id = this.currentId.classes++;
    const newClass: Class = { ...classData, id };
    this.classes.set(id, newClass);
    return newClass;
  }

  private createActivitySync(activity: InsertActivity): Activity {
    const id = this.currentId.activities++;
    const newActivity: Activity = { ...activity, id };
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

  async getClasses(filters?: { language?: string; level?: string; timeOfDay?: string }): Promise<ClassWithDetails[]> {
    let classArray = Array.from(this.classes.values());
    
    if (filters?.level) {
      classArray = classArray.filter(c => c.level.toLowerCase() === filters.level?.toLowerCase());
    }
    
    return classArray.map(classItem => {
      const instructor = this.instructors.get(classItem.instructorId)!;
      const language = this.languages.get(classItem.languageId)!;
      return {
        ...classItem,
        instructor,
        language,
      };
    });
  }

  async getClass(id: number): Promise<ClassWithDetails | undefined> {
    const classItem = this.classes.get(id);
    if (!classItem) return undefined;
    
    const instructor = this.instructors.get(classItem.instructorId)!;
    const language = this.languages.get(classItem.languageId)!;
    
    return {
      ...classItem,
      instructor,
      language,
    };
  }

  async createClass(classData: InsertClass): Promise<Class> {
    return this.createClassSync(classData);
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const classItem = this.classes.get(id);
    if (!classItem) return undefined;
    
    const updatedClass = { ...classItem, ...classData };
    this.classes.set(id, updatedClass);
    return updatedClass;
  }

  async getInstructor(id: number): Promise<Instructor | undefined> {
    return this.instructors.get(id);
  }

  async createInstructor(instructor: InsertInstructor): Promise<Instructor> {
    return this.createInstructorSync(instructor);
  }

  async getLanguages(): Promise<Language[]> {
    return Array.from(this.languages.values());
  }

  async createLanguage(language: InsertLanguage): Promise<Language> {
    return this.createLanguageSync(language);
  }

  async getUserBookings(userId: number): Promise<(Booking & { class: ClassWithDetails })[]> {
    const userBookings = Array.from(this.bookings.values()).filter(b => b.userId === userId);
    
    return userBookings.map(booking => {
      const classItem = this.classes.get(booking.classId)!;
      const instructor = this.instructors.get(classItem.instructorId)!;
      const language = this.languages.get(classItem.languageId)!;
      
      return {
        ...booking,
        class: {
          ...classItem,
          instructor,
          language,
        },
      };
    });
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.currentId.bookings++;
    const newBooking: Booking = { ...booking, id };
    this.bookings.set(id, newBooking);
    
    // Update class current students
    const classItem = this.classes.get(booking.classId);
    if (classItem) {
      const updatedClass = { ...classItem, currentStudents: classItem.currentStudents + 1 };
      this.classes.set(booking.classId, updatedClass);
    }
    
    return newBooking;
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
    const totalClasses = Array.from(this.classes.values()).length;
    
    return {
      activeClasses: user?.activeClasses || 0,
      hoursThisWeek: user?.hoursThisWeek || 0,
      streak: `${user?.streak || 0} days`,
      availableClasses: totalClasses,
    };
  }
}

export const storage = new MemStorage();
