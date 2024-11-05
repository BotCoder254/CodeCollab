# CodeCollab - Real-time Collaborative Code Editor

<div align="center">
  
  <i class="fas fa-code text-white text-xl"></i>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)](https://nodejs.org/)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
</div>

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit code simultaneously
- **Monaco Editor Integration**: Professional code editing experience
- **Project Management**: Create, manage, and organize coding projects
- **File System**: Full file management capabilities
- **Access Control**: Role-based permissions system
- **Syntax Highlighting**: Support for multiple programming languages
- **Auto-save**: Never lose your work
- **Responsive Design**: Works on desktop and tablet devices

## 📸 Screenshots

<div align="center">
  <img src="./public/projectsamples/Screenshot (23).png" alt="Dashboard" width="800"/>
  <p><em>Dashboard View</em></p>
  
  <img src="/public/projectsamples/Screenshot (21).png" alt="Editor" width="800"/>
  <p><em>Code Editor with Real-time Collaboration</em></p>
  
  <img src="./public/projectsamples/Screenshot (19).png" alt="Project Management" width="800"/>
  <p><em>Project Management Interface</em></p>
</div>

## 🛠️ Tech Stack

- **Frontend**:
  - EJS Templates
  - TailwindCSS
  - Monaco Editor
  - Socket.IO Client

- **Backend**:
  - Node.js
  - Express.js
  - MongoDB
  - Socket.IO
  - JWT Authentication

## 🚀 Quick Start

1. **Clone the repository** 

```bash
git clone https://github.com/yourusername/codecollab.git
cd codecollab
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the server**

```bash
npm start
```

## 🌐 Environment Variables

Create a `.env` file in the root directory:

```bash
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

## 📁 Project Structure

```bash
 codecollab/
├── config/
│ └── db.js
├── middleware/
│ ├── auth.js
│ └── fileValidation.js
├── models/
│ ├── File.js
│ ├── Project.js
│ └── User.js
├── public/
│ ├── css/
│ ├── js/
│ └── images/
├── routes/
│ ├── auth.js
│ ├── files.js
│ └── projects.js
├── views/
│ ├── layout.ejs
│ └── pages/
├── server.js
└── package.json
```

## 🔒 Security Features

- JWT Authentication
- Role-based Access Control
- Input Validation
- XSS Protection
- Rate Limiting
- File Size Restrictions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Lead Developer**: [TELVIN TEUM](https://github.com/BotCoder254)
- **Contributors**: 
 
## 🌟 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Socket.IO](https://socket.io/)
- [Express.js](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)

## 📞 Support

For support, email support@codecollab.com or join our [Discord community](https://discord.gg/codecollab).

## 🚀 Roadmap

- [ ] Integrated Terminal
- [ ] Git Integration
- [ ] Theme Customization
- [ ] Mobile Support
- [ ] Video Chat
- [ ] AI Code Completion

---

<div align="center">
  <p>Made with ❤️ by the CodeCollab Team</p>
  <p>
    <a href="https://twitter.com/codecollab">Twitter</a> •
    <a href="https://discord.gg/codecollab">Discord</a> •
    <a href="https://codecollab.dev">Website</a>
  </p>
</div>


