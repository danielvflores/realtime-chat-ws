CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  fromUser TEXT NOT NULL,
  toUser TEXT,
  message TEXT NOT NULL,
  messageDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  roomFromMessage TEXT,
  messageType TEXT DEFAULT 'text' CHECK (messageType IN ('text', 'image', 'file', 'system')),
  isEdited BOOLEAN DEFAULT 0,
  editedAt DATETIME,
  replyTo TEXT,
  FOREIGN KEY (fromUser) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (toUser) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (replyTo) REFERENCES messages(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_messages_fromUser ON messages(fromUser);
CREATE INDEX idx_messages_toUser ON messages(toUser);
CREATE INDEX idx_messages_room ON messages(roomFromMessage);
CREATE INDEX idx_messages_date ON messages(messageDate);
CREATE INDEX idx_messages_reply ON messages(replyTo);
