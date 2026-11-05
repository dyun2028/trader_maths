const { contextBridge, ipcRenderer } = require('electron');

const call = (channel) => (arg) => ipcRenderer.invoke(channel, arg);

contextBridge.exposeInMainWorld('api', {
  topics: call('topics'),
  next: call('next'),
  answer: call('answer'),
  startSession: call('startSession'),
  endSession: call('endSession'),
  reviewCount: call('reviewCount'),
  reviewNext: call('reviewNext'),
  stats: call('stats'),
});
