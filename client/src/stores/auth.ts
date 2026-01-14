import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import { authApi } from '@/services';
import socketService from '@/socket';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  async function login(username: string, password: string) {
    loading.value = true;
    try {
      const response = await authApi.login(username, password);
      if (response.data.code === 200) {
        const { token: newToken, user: newUser } = response.data.data;
        token.value = newToken;
        user.value = newUser;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        socketService.connect();
        return true;
      }
      return false;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string, email: string, password: string) {
    loading.value = true;
    try {
      const response = await authApi.register(username, email, password);
      if (response.data.code === 200) {
        const { token: newToken, user: newUser } = response.data.data;
        token.value = newToken;
        user.value = newUser;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        socketService.connect();
        return true;
      }
      return false;
    } catch (error) {
      console.error('注册失败:', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      socketService.disconnect();
    }
  }

  async function fetchUser() {
    if (!token.value) return;
    try {
      const response = await authApi.getMe();
      if (response.data.code === 200) {
        user.value = response.data.data;
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
  };
});
