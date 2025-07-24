# Cost Katana AI Optimizer for Cursor

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://marketplace.visualstudio.com/items?itemName=cost-katana.ai-optimizer)
[![Downloads](https://img.shields.io/badge/downloads-0-brightgreen.svg)](https://marketplace.visualstudio.com/items?itemName=cost-katana.ai-optimizer)
[![Rating](https://img.shields.io/badge/rating-0.0-yellow.svg)](https://marketplace.visualstudio.com/items?itemName=cost-katana.ai-optimizer)

## 🚀 **AI Cost Optimization for Cursor IDE**

Transform your Cursor development experience with intelligent AI cost optimization. Track, analyze, and optimize your AI usage across all models (GPT-4, Claude, Gemini, and more) directly within your IDE.

## ✨ **Features**

### 🎯 **Complete Model Support**
- **30+ AI Models**: Support for all Cursor models (GPT-4o, Claude 4, Gemini 2.5, Deepseek, Grok, o1/o3)
- **Real-time Cost Tracking**: Monitor AI usage and costs in real-time
- **Smart Recommendations**: AI-powered optimization suggestions

### 🔧 **Core Functionality**
- **Usage Tracking**: Track AI requests with detailed cost breakdown
- **Prompt Optimization**: Optimize prompts to reduce tokens and costs
- **Code Analysis**: Analyze code for optimization opportunities
- **Model Comparison**: Compare models for cost vs. quality trade-offs
- **Cost Forecasting**: Predict future costs with AI-powered analytics

### 🧠 **Advanced Intelligence**
- **Personalized Tips**: Get AI-powered recommendations based on your usage
- **Quality Scoring**: Evaluate response quality and cost-effectiveness
- **Smart Monitoring**: Proactive alerts and optimization suggestions
- **Agent Integration**: Query AI agent for complex optimization questions

### 📊 **Analytics & Insights**
- **Real-time Analytics**: Comprehensive usage analytics and insights
- **Performance Analysis**: Efficiency scoring and performance correlation
- **Comparative Analytics**: Compare usage across different time periods
- **Export Capabilities**: Export data for external analysis

## 🎮 **Quick Start**

### 1. **Install Extension**
```bash
# Install via VSIX
code --install-extension cost-katana-ai-optimizer-1.0.0.vsix

# Or install from VS Code Marketplace
# Search for "Cost Katana AI Optimizer"
```

### 2. **Connect to Backend**
1. Open Command Palette (`Cmd/Ctrl + Shift + P`)
2. Run `Cost Katana: Connect to Backend`
3. Enter your API key or use magic link onboarding

### 3. **Start Optimizing**
- **Track Usage**: `Cost Katana: Track AI Usage`
- **Get Recommendations**: `Cost Katana: Get Model Recommendations`
- **Optimize Prompts**: `Cost Katana: Optimize Prompt`
- **Analyze Code**: `Cost Katana: Analyze Code`

## 🎯 **Available Commands**

### **Core Commands**
- `Cost Katana: Connect to Backend` - Connect to Cost Katana backend
- `Cost Katana: Track AI Usage` - Track AI request usage and costs
- `Cost Katana: Optimize Prompt` - Optimize prompts for cost reduction
- `Cost Katana: Setup Workspace` - Setup workspace for project tracking
- `Cost Katana: Get Suggestions` - Get AI-powered code suggestions
- `Cost Katana: Analyze Code` - Analyze code for optimization opportunities
- `Cost Katana: Show Analytics` - Display usage analytics
- `Cost Katana: Get Model Recommendations` - Get model selection recommendations

### **Intelligence Commands**
- `Cost Katana: Get Personalized Tips` - Get personalized optimization tips
- `Cost Katana: Score Response Quality` - Score AI response quality

### **Monitoring Commands**
- `Cost Katana: Trigger Monitoring` - Trigger real-time monitoring
- `Cost Katana: Get User Status` - Get current usage status

### **Experimentation Commands**
- `Cost Katana: Run Model Comparison` - Compare different AI models

### **Pricing Commands**
- `Cost Katana: Compare Pricing` - Compare model pricing

### **Forecasting Commands**
- `Cost Katana: Generate Cost Forecast` - Generate cost forecasts

### **Agent Commands**
- `Cost Katana: Query AI Agent` - Query AI agent for optimization help

### **Optimization Commands**
- `Cost Katana: Analyze Opportunities` - Analyze optimization opportunities

### **Template Commands**
- `Cost Katana: Get Prompt Templates` - Get prompt templates

## 🔧 **Configuration**

### **Settings**
```json
{
  "costKatana.backendUrl": "https://cost-katana-backend.store/api",
  "costKatana.apiKey": "your-api-key-here"
}
```

### **Supported Models**
- **OpenAI**: GPT-4o, GPT-4o-mini, GPT-4.1, GPT-4.5-preview, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 4 Opus, Claude 4 Sonnet
- **Google**: Gemini 2.0 Pro, Gemini 2.5 Flash, Gemini 2.5 Pro
- **Deepseek**: Deepseek R1, Deepseek V3, Deepseek V3.1
- **Grok**: Grok 2, Grok 3 Beta, Grok 3 Mini, Grok 4
- **Anthropic o1/o3**: o1, o1-mini, o3, o3-mini, o4-mini
- **Cursor**: Cursor Small

## 📊 **Usage Examples**

### **Track AI Usage**
```bash
# Command: Cost Katana: Track AI Usage
# Select model: claude-4-opus
# Enter prompt and response
# Get detailed cost breakdown and optimization tips
```

### **Optimize Prompts**
```bash
# Command: Cost Katana: Optimize Prompt
# Select text in editor
# Get optimized version with token reduction
# Apply or copy to clipboard
```

### **Get Model Recommendations**
```bash
# Command: Cost Katana: Get Model Recommendations
# Select task type: "Complex algorithm implementation"
# Select budget: "Medium cost (under $0.10 per request)"
# Get recommended models with cost estimates
```

## 🔗 **Backend Integration**

The extension integrates with the Cost Katana backend API:

```bash
# Health check
GET https://cost-katana-backend.store/api/cursor/health

# Track usage
POST https://cost-katana-backend.store/api/cursor/action
{
  "action": "track_usage",
  "ai_request": {
    "model": "claude-4-opus",
    "prompt": "...",
    "response": "..."
  }
}
```

## 🎯 **Benefits**

### **For Developers**
- ✅ **Complete cost visibility** across all AI usage
- ✅ **Intelligent optimization** recommendations
- ✅ **Model selection guidance** based on cost/quality
- ✅ **Proactive monitoring** with alerts
- ✅ **Advanced analytics** for decision making

### **For Organizations**
- ✅ **Comprehensive cost tracking** across teams
- ✅ **Predictive cost management** with forecasting
- ✅ **Performance optimization** insights
- ✅ **Template standardization** for consistency
- ✅ **AI agent assistance** for complex queries

## 🚀 **Advanced Features**

### **AI Agent Integration**
- **Conversational AI** for cost optimization queries
- **Thinking process** visualization
- **Multi-step reasoning** for complex questions
- **Context-aware** recommendations

### **Template Management**
- **Prompt template library** with usage tracking
- **Variable substitution** for dynamic prompts
- **Cost estimation** for template usage
- **Template optimization** suggestions

### **Predictive Analytics**
- **Cost forecasting** with confidence intervals
- **Performance correlation** analysis
- **Efficiency scoring** with breakdowns
- **Comparative analytics** across time periods

## 📈 **Performance**

- **Lightweight**: Minimal impact on IDE performance
- **Fast**: Real-time cost calculations and recommendations
- **Reliable**: Robust error handling and fallback mechanisms
- **Secure**: Secure API key management and data transmission

## 🔒 **Security & Privacy**

- **API Key Security**: Secure storage and transmission of API keys
- **Data Privacy**: No sensitive code or data sent to backend
- **Local Processing**: Cost calculations performed locally when possible
- **Encrypted Communication**: All API communication encrypted

## 🛠 **Development**

### **Building from Source**
```bash
# Clone repository
git clone <repository-url>
cd ai-cost-optimizer-extension

# Install dependencies
npm install

# Build extension
npm run compile

# Package extension
vsce package
```

### **Testing**
```bash
# Run tests
npm test

# Lint code
npm run lint
```

## 📞 **Support**

- **Documentation**: [Cost Katana Docs](https://docs.cost-katana.com)
- **Issues**: [GitHub Issues](https://github.com/cost-katana/extension/issues)
- **Discord**: [Cost Katana Community](https://discord.gg/cost-katana)
- **Email**: support@cost-katana.com

## 📄 **License**

This extension is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 🎉 **Acknowledgments**

- Built for the Cursor IDE community
- Powered by Cost Katana AI optimization platform
- Thanks to all contributors and beta testers

---

**Transform your AI development with intelligent cost optimization! 🚀** # ai-cost-optimizer-extension
