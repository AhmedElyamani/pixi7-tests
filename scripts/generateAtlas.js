const { packAsync } = require('free-tex-packer-core');
const fs = require('fs').promises;
const path = require('path');

async function getResourcesFolders() {
  const resourcesDir = path.join(__dirname, '..', 'resources');
  
  try {
    const items = await fs.readdir(resourcesDir, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => item.name);
  } catch (error) {
    console.error('❌ Failed to read resources directory:', error);
    return [];
  }
}

async function generateAtlasForFolder(folderName) {
  try {
    console.log(`🎨 Processing atlas: ${folderName}`);
    
    const resourcesDir = path.join(__dirname, '..', 'resources', folderName);
    const assetsDir = path.join(__dirname, '..', 'assets', 'images');
    
    // Ensure assets directory exists
    await fs.mkdir(assetsDir, { recursive: true });
    
    // Read all PNG files from the folder
    const files = await fs.readdir(resourcesDir);
    const sourceImageFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
    
    if (sourceImageFiles.length === 0) {
      console.log(`⚠️  No PNG files found in ${folderName}, skipping...`);
      return;
    }
    
    console.log(`📁 Found ${sourceImageFiles.length} PNG files in ${folderName}`);
    
    // Prepare images for packing
    const images = [];
    for (const file of sourceImageFiles) {
      const filePath = path.join(resourcesDir, file);
      const name = path.parse(file).name; // Remove extension
      
      images.push({
        path: filePath,
        name,
        contents: await fs.readFile(filePath)
      });
    }
    
    // Pack textures
    const result = await packAsync(images, {
      textureName: folderName,
      exporter: 'Pixi',
      width: 2048,
      height: 2048,
      padding: 2,
      extrude: 1,
      format: 'RGBA8888',
      textureFormat: 'png',
      allowRotation: false,
      detectIdentical: false,
      allowTrim: true,
      trimMode: 1,
      alphaThreshold: 0,
      removeFileExtension: true,
      prependFolderName: false,
    });
    
    if (!result || result.length === 0) {
      throw new Error(`Failed to generate texture atlas for ${folderName}`);
    }
    
    // Find JSON and PNG data in results
    const jsonFiles = [];
    const pngFiles = [];
    
    for (const item of result) {
      if (item.name.endsWith('.json')) {
        jsonFiles.push({
          name: item.name,
          buffer: item.buffer
        });
      } else if (item.name.endsWith('.png')) {
        pngFiles.push({
          name: item.name,
          buffer: item.buffer
        });
      }
    }
    
    if (jsonFiles.length === 0 || pngFiles.length === 0) {
      throw new Error(`Missing JSON or PNG data in atlas generation result for ${folderName}`);
    }
    
    // Save all PNG files with proper naming
    const pageMapping = new Map();
    for (let i = 0; i < pngFiles.length; i++) {
      const pngFile = pngFiles[i];
      const newPageName = `${folderName}-${i}.png`;
      
      // Map original name to new name for JSON update
      pageMapping.set(pngFile.name, newPageName);
      
      await fs.writeFile(
        path.join(assetsDir, newPageName), 
        pngFile.buffer
      );
      console.log(`💾 Saved texture sheet: ${newPageName}`);
    }
    
    // Save each JSON file individually and create a master JSON with related_multi_packs
    let allFrames = {};
    let allAnimations = {};
    let masterMeta = null;
    
    // Process and save individual JSON files
    for (let jsonIndex = 0; jsonIndex < jsonFiles.length; jsonIndex++) {
      const jsonFile = jsonFiles[jsonIndex];
      const jsonData = JSON.parse(jsonFile.buffer.toString());
      
      // Update the image reference in this JSON
      if (jsonData.meta && jsonData.meta.image) {
        const originalImageName = jsonData.meta.image;
        if (pageMapping.has(originalImageName)) {
          jsonData.meta.image = pageMapping.get(originalImageName);
        }
      }
      
      // Save individual JSON file
      if (jsonIndex === 0) {
        // First JSON becomes the master file
        const masterJsonPath = path.join(assetsDir, `${folderName}.json`);
        
        // Add related_multi_packs if there are multiple pages
        if (jsonFiles.length > 1) {
          const relatedPacks = [];
          for (let i = 1; i < jsonFiles.length; i++) {
            relatedPacks.push(`${folderName}-${i}.json`);
          }
          jsonData.meta.related_multi_packs = relatedPacks;
        }
        
        await fs.writeFile(masterJsonPath, JSON.stringify(jsonData, null, 2));
        masterMeta = jsonData.meta;
        console.log(`💾 Saved master JSON: ${folderName}.json`);
      } else {
        // Additional JSON files
        const pageJsonPath = path.join(assetsDir, `${folderName}-${jsonIndex}.json`);
        await fs.writeFile(pageJsonPath, JSON.stringify(jsonData, null, 2));
        console.log(`💾 Saved page JSON: ${folderName}-${jsonIndex}.json`);
      }
      
      // Collect all frames for counting
      if (jsonData.frames) {
        Object.assign(allFrames, jsonData.frames);
      }
      if (jsonData.animations) {
        Object.assign(allAnimations, jsonData.animations);
      }
    }
    
    console.log(`✅ Atlas '${folderName}' generated successfully!`);
    console.log(`📋 Master JSON: ${folderName}.json`);
    console.log(`📄 Generated ${pngFiles.length} texture sheet(s)`);
    console.log(`📄 Generated ${jsonFiles.length} JSON file(s)`);
    console.log(`🎯 Packed ${Object.keys(allFrames).length} textures`);
    console.log(''); // Empty line for readability
    
  } catch (error) {
    console.error(`❌ Failed to generate texture atlas for ${folderName}:`, error);
  }
}

async function generateAllTextureAtlases() {
  try {
    console.log('🚀 Starting texture atlas generation...');
    console.log('');
    
    const folders = await getResourcesFolders();
    
    if (folders.length === 0) {
      console.log('⚠️  No resource folders found in resources/ directory');
      return;
    }
    
    console.log(`📂 Found ${folders.length} resource folder(s): ${folders.join(', ')}`);
    console.log('');
    
    // Process each folder
    for (const folderName of folders) {
      await generateAtlasForFolder(folderName);
    }
    
    console.log('🎉 All texture atlases generated successfully!');
    
  } catch (error) {
    console.error('❌ Failed to generate texture atlases:', error);
    process.exit(1);
  }
}

generateAllTextureAtlases();