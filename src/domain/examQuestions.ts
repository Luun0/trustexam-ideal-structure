export interface Question {
  id: number;
  text: string;
  options: string[];
}

export const QUESTIONS: Question[] = [
  { id: 1, text: 'Какой алгоритм имеет временную сложность O(n log n) в среднем случае?', options: ['Пузырьковая сортировка O(n²)', 'Быстрая сортировка O(n log n)', 'Линейный поиск O(n)', 'Сортировка подсчётом O(n+k)'] },
  { id: 2, text: 'Что такое REST API?', options: ['Протокол передачи файлов', 'Архитектурный стиль для веб-сервисов', 'Язык программирования', 'База данных'] },
  { id: 3, text: 'Какая структура данных работает по принципу LIFO?', options: ['Очередь', 'Массив', 'Стек', 'Связный список'] },
  { id: 4, text: 'Что означает SQL?', options: ['Structured Query Language', 'Simple Queue List', 'System Query Logic', 'Sequential Query Layer'] },
  { id: 5, text: 'Какой HTTP метод используется для создания ресурса?', options: ['GET', 'DELETE', 'POST', 'PATCH'] },
];
