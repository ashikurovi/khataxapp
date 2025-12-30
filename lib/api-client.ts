import { ApiResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get token and userId from localStorage if available
    let token: string | null = null;
    let userId: string | null = null;
    if (typeof window !== "undefined") {
      try {
        token = localStorage.getItem("authToken");
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          userId = user.userId || null;
        }
      } catch (e) {
        // Ignore errors reading from localStorage
      }
    }
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    
    // Add Authorization header with token if available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Add userId to headers if available (for backward compatibility)
    if (userId) {
      headers["x-user-id"] = userId;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "An error occurred",
      }));
      throw new Error(error.error || "Request failed");
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

