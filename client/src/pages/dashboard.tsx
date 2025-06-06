import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Calendar, CheckCircle2, Circle, Trash2, LogOut, Edit, ArrowUpDown } from "lucide-react";
import { TaskWithCategory, UserStats, Category, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithCategory | null>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'category' | 'title'>('dueDate');
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    categoryId: "",
    dueDate: "",
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#3B82F6",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<TaskWithCategory[]>({
    queryKey: ["/api/tasks", selectedCategory, showCompleted],
    queryFn: ({ queryKey }) => {
      const [baseUrl, categoryId, completed] = queryKey;
      const params = new URLSearchParams();
      if (categoryId) params.append("categoryId", categoryId.toString());
      if (completed !== null) params.append("completed", completed.toString());
      
      const url = params.toString() ? `${baseUrl}?${params}` : baseUrl as string;
      return fetch(url, { credentials: "include" }).then(res => res.json());
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["/api/user/activities"],
  });

  // Fetch heatmap data for the last 7 days for the progress chart
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  
  const { data: heatmapData } = useQuery({
    queryKey: ["/api/user/heatmap", sevenDaysAgo, today],
    queryFn: async () => {
      const response = await fetch(`/api/user/heatmap?startDate=${sevenDaysAgo}&endDate=${today}`, {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Transform heatmap data for the chart
  const chartData = Array.isArray(heatmapData) ? heatmapData.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tasks: item.count
  })) : [];

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: number) => apiRequest("POST", `/api/tasks/${taskId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/activities"] });
      toast({
        title: "Task completed!",
        description: "Great job! Your streak continues.",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => apiRequest("POST", "/api/tasks", taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      setIsCreateTaskOpen(false);
      setNewTask({ title: "", description: "", categoryId: "", dueDate: "" });
      toast({
        title: "Task created!",
        description: "Your new task has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PUT", `/api/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      setEditingTask(null);
      toast({
        title: "Task updated!",
        description: "Your task has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: any) => apiRequest("POST", "/api/categories", categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCreateCategoryOpen(false);
      setNewCategory({ name: "", color: "#3B82F6" });
      toast({
        title: "Category created!",
        description: "Your new category has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create category. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => apiRequest("DELETE", `/api/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Task has been removed from your list.",
      });
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      title: newTask.title,
      description: newTask.description || undefined,
      categoryId: newTask.categoryId ? parseInt(newTask.categoryId) : undefined,
      dueDate: newTask.dueDate || undefined,
    };

    createTaskMutation.mutate(taskData);
  };

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }

    createCategoryMutation.mutate(newCategory);
  };

  const handleEditTask = (task: TaskWithCategory) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || "",
      categoryId: task.categoryId?.toString() || "",
      dueDate: task.dueDate || "",
    });
  };

  const handleUpdateTask = () => {
    if (!editingTask || !newTask.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a task title.",
        variant: "destructive",
      });
      return;
    }

    const taskData = {
      title: newTask.title,
      description: newTask.description || undefined,
      categoryId: newTask.categoryId ? parseInt(newTask.categoryId) : undefined,
      dueDate: newTask.dueDate || undefined,
    };

    updateTaskMutation.mutate({ id: editingTask.id, data: taskData });
  };

  // Points calculation formula: Base points + Streak bonus + Category bonus
  const calculatePoints = (completedTasks: number, currentStreak: number) => {
    const basePoints = completedTasks * 10; // 10 points per task
    const streakBonus = Math.floor(currentStreak / 3) * 5; // 5 bonus points every 3-day streak
    const weeklyBonus = Math.floor(completedTasks / 7) * 25; // 25 bonus points for every 7 tasks
    return basePoints + streakBonus + weeklyBonus;
  };

  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate === today && !task.completed;
  });

  const upcomingTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    });
    return task.dueDate && next7Days.includes(task.dueDate) && !task.completed && task.dueDate !== today;
  });

  const completedTasks = tasks.filter(task => task.completed);

  // Filter, sort and display tasks
  let filteredTasks = showCompleted ? tasks.filter(t => t.completed) : tasks.filter(t => !t.completed);
  
  // Apply category filter
  if (selectedCategory !== null) {
    filteredTasks = filteredTasks.filter(task => task.categoryId === selectedCategory);
  }
  
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'category':
        const aCat = a.category?.name || 'No Category';
        const bCat = b.category?.name || 'No Category';
        return aCat.localeCompare(bCat);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const displayedTasks = sortedTasks;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="text-white text-sm" />
                </div>
                <span className="text-xl font-bold text-foreground">TaskFlow</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.profileImageUrl && (
                <img 
                  src={user.profileImageUrl}
                  alt="User profile" 
                  className="w-8 h-8 rounded-full" 
                />
              )}
              <span className="text-sm font-medium text-foreground">
                {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.firstName || "User"}!
          </h1>
          <p className="text-muted-foreground">Ready to tackle your tasks and build your streak?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tasks Today</p>
                <p className="text-2xl font-bold text-foreground">{stats?.tasksToday || 0}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-lg">
                <Calendar className="text-primary w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Tasks</p>
                <p className="text-2xl font-bold text-foreground">{stats?.upcomingTasks || 0}</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-lg">
                <Calendar className="text-secondary w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">{stats?.currentStreak || 0} days</p>
              </div>
              <div className="bg-accent/10 p-3 rounded-lg">
                <CheckCircle2 className="text-accent w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-foreground">{calculatePoints(completedTasks.length, stats?.currentStreak || 0)}</p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg">
                <CheckCircle2 className="text-purple-600 dark:text-purple-400 w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Overview Chart */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Progress Overview</h3>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Task Management */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Your Tasks</h2>
              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={(value: 'dueDate' | 'category' | 'title') => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          placeholder="Enter task description (optional)"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={newTask.categoryId}
                          onValueChange={(value) => setNewTask({ ...newTask, categoryId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                <div className="flex items-center">
                                  <div 
                                    className="w-2 h-2 rounded-full mr-2" 
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCreateTaskOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateTask}
                          disabled={createTaskMutation.isPending}
                        >
                          {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Task Dialog */}
                <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editTitle">Title</Label>
                        <Input
                          id="editTitle"
                          value={newTask.title}
                          onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                          placeholder="Enter task title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editDescription">Description</Label>
                        <Textarea
                          id="editDescription"
                          value={newTask.description}
                          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                          placeholder="Enter task description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="editCategory">Category</Label>
                        <Select value={newTask.categoryId} onValueChange={(value) => setNewTask({...newTask, categoryId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 rounded-full mr-2" 
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="editDueDate">Due Date</Label>
                        <Input
                          id="editDueDate"
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setEditingTask(null)}>
                          Cancel
                        </Button>
                        <Button onClick={handleUpdateTask} disabled={updateTaskMutation.isPending}>
                          {updateTaskMutation.isPending ? "Updating..." : "Update Task"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant={showCompleted ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowCompleted(false)}
                >
                  Active
                </Button>
                <Button
                  variant={showCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowCompleted(true)}
                >
                  Completed
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </Button>
              ))}
              <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="categoryName">Name</Label>
                      <Input
                        id="categoryName"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryColor">Color</Label>
                      <Input
                        id="categoryColor"
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateCategoryOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending}>
                        {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Tasks List */}
            {tasksLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedTasks.map((task) => (
                  <Card key={task.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <button
                            onClick={() => !task.completed && completeTaskMutation.mutate(task.id)}
                            disabled={task.completed || completeTaskMutation.isPending}
                            className="transition-colors"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-secondary" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                            )}
                          </button>
                          <h3 className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </h3>
                          {task.category && (
                            <Badge 
                              variant="outline" 
                              style={{ 
                                borderColor: task.category.color,
                                color: task.category.color 
                              }}
                            >
                              {task.category.name}
                            </Badge>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {task.dueDate && (
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          )}
                          {task.completedAt && (
                            <span>Completed: {new Date(task.completedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          disabled={deleteTaskMutation.isPending}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {displayedTasks.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      {showCompleted ? "No completed tasks yet" : "No active tasks. Great job!"}
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Tasks */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Today's Priority</h3>
              <div className="space-y-3">
                {todayTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center space-x-3">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{task.title}</span>
                  </div>
                ))}
                {todayTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">All caught up for today!</p>
                )}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm text-foreground">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : "Recently"}
                      </p>
                    </div>
                  </div>
                ))}
                
                {activities.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Task
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Calendar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
