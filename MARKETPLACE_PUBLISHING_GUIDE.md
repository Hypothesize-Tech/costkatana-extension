# 🚀 **VS Code Marketplace Publishing Guide**

## 📋 **Prerequisites**

### **1. Microsoft Partner Account**
1. Go to [Microsoft Partner Center](https://partner.microsoft.com)
2. Sign in with your Microsoft account
3. Complete the publisher registration process
4. Verify your identity and business information

### **2. Azure DevOps Organization**
1. Create an Azure DevOps organization at [dev.azure.com](https://dev.azure.com)
2. Set up your organization with a unique name
3. This will be your publisher ID (e.g., `cost-katana`)

### **3. Personal Access Token (PAT)**
1. In Azure DevOps, go to **User Settings** → **Personal Access Tokens**
2. Create a new token with **Marketplace (Publish)** scope
3. Copy the token (you'll need it for authentication)

---

## 🔧 **Setup Steps**

### **Step 1: Login to Marketplace**
```bash
# Login with your publisher ID
vsce login cost-katana

# You'll be prompted for:
# - Personal Access Token (PAT)
# - Azure DevOps organization URL
```

### **Step 2: Verify Publisher Access**
```bash
# Verify your PAT has publish rights
vsce verify-pat cost-katana
```

### **Step 3: Check Extension Package**
```bash
# List files that will be published
vsce ls

# Package the extension
vsce package
```

---

## 📦 **Publishing Process**

### **Step 1: Final Package Check**
```bash
# Ensure all files are included
vsce ls

# Package the extension
vsce package
```

### **Step 2: Publish to Marketplace**
```bash
# Publish the extension
vsce publish

# Or publish with specific version
vsce publish patch  # 1.0.0 -> 1.0.1
vsce publish minor  # 1.0.0 -> 1.1.0
vsce publish major  # 1.0.0 -> 2.0.0
```

### **Step 3: Verify Publication**
1. Check the [VS Code Marketplace](https://marketplace.visualstudio.com)
2. Search for "Cost Katana AI Optimizer"
3. Verify your extension appears correctly

---

## 🎯 **Publisher Account Setup Details**

### **Microsoft Partner Center Registration**
1. **Account Type**: Choose "Individual" or "Company"
2. **Publisher ID**: Request `cost-katana` (or your preferred ID)
3. **Contact Information**: Provide valid contact details
4. **Identity Verification**: Complete verification process
5. **Payment Information**: Add payment method (if applicable)

### **Azure DevOps Organization**
1. **Organization Name**: `cost-katana` (or your preferred name)
2. **Region**: Choose closest to your location
3. **Project**: Create a project for extension management
4. **Permissions**: Ensure you have admin access

### **Personal Access Token Setup**
1. **Scope**: Marketplace (Publish)
2. **Expiration**: Set appropriate expiration (recommend 1 year)
3. **Permissions**: Full access to Marketplace publishing
4. **Security**: Store token securely

---

## 📋 **Required Marketplace Assets**

### **✅ Already Included**
- ✅ **README.md**: Comprehensive documentation
- ✅ **CHANGELOG.md**: Version history
- ✅ **LICENSE**: MIT License
- ✅ **package.json**: Extension manifest
- ✅ **Icon**: Basic icon (can be improved later)

### **🔄 Optional Improvements**
- **Better Icon**: Create a professional 128x128 PNG icon
- **Screenshots**: Add usage screenshots
- **Demo Video**: Create a demo video
- **Detailed Description**: Enhance marketplace description

---

## 🔍 **Marketplace Listing Optimization**

### **Keywords for Discovery**
- `ai cost optimization`
- `cursor extension`
- `gpt cost tracking`
- `claude optimization`
- `gemini cost management`
- `ai usage analytics`
- `prompt optimization`
- `cost katana`

### **Categories**
- **Primary**: Other

### **Tags**
- `ai`, `cost`, `optimization`, `cursor`, `gpt`, `claude`, `gemini`

---

## 🚀 **Publishing Commands**

### **Complete Publishing Workflow**
```bash
# 1. Build and package
npm run compile
vsce package

# 2. Login (first time only)
vsce login cost-katana

# 3. Publish
vsce publish

# 4. Verify
# Check marketplace listing
```

### **Update Existing Extension**
```bash
# Update version in package.json
npm version patch  # or minor/major

# Build and publish
npm run compile
vsce publish
```

---

## 📊 **Post-Publishing Checklist**

### **✅ Verification Steps**
- [ ] Extension appears in marketplace search
- [ ] All files included correctly
- [ ] README displays properly
- [ ] Commands work as expected
- [ ] Configuration options available
- [ ] Icon displays correctly

### **📈 Marketing Steps**
- [ ] Share on social media
- [ ] Post in developer communities
- [ ] Create demo videos
- [ ] Write blog posts
- [ ] Engage with user feedback

### **🔧 Maintenance**
- [ ] Monitor user reviews
- [ ] Track download statistics
- [ ] Respond to issues
- [ ] Plan feature updates
- [ ] Update documentation

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Authentication Errors**
```bash
# Re-login if token expires
vsce logout cost-katana
vsce login cost-katana
```

#### **Publishing Failures**
```bash
# Check package contents
vsce ls

# Verify publisher access
vsce verify-pat cost-katana

# Check for validation errors
vsce package --no-dependencies
```

#### **Version Conflicts**
```bash
# Check current version
npm version

# Update version
npm version patch
```

---

## 🎉 **Success!**

Once published, your extension will be available at:
**https://marketplace.visualstudio.com/items?itemName=cost-katana.cost-katana-ai-optimizer**

### **Extension Features Live**
- ✅ **50+ API endpoints** fully integrated
- ✅ **18 VS Code commands** for complete functionality
- ✅ **30+ AI models** supported
- ✅ **Real-time cost tracking** and optimization
- ✅ **AI-powered recommendations** and insights
- ✅ **Model comparison** and cost analysis
- ✅ **Predictive analytics** and forecasting

### **Next Steps**
1. **Monitor**: Track downloads and user feedback
2. **Engage**: Respond to user questions and issues
3. **Improve**: Plan feature updates based on feedback
4. **Market**: Promote your extension in developer communities

---

## 📞 **Support Resources**

- **VS Code Extension API**: https://code.visualstudio.com/api
- **Marketplace Documentation**: https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview
- **Publisher Support**: https://aka.ms/vscode-discussions
- **Cost Katana Backend**: https://api.costkatana.com/api

**Happy publishing! 🚀** 