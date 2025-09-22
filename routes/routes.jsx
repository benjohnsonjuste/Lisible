import Home from '../pages/index';
import Application from '../pages/application';
import NotFound from '../pages/notfound';

export const routes = [
  { path: '/', component: Home },
  { path: '/application', component: Application },
  { path: '*', component: NotFound }
];
