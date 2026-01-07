// Google Apps Script for Contact Form
// Copy this entire code to your Google Apps Script editor

// IMPORTANT: Update these settings for your sheet
const SHEET_ID = '1bS0kBJrsN8k8EA6HqZKqNoe9gozXoXxtWzmMMQ-Yavs'; // Your sheet ID from the URL
const sheetName = 'Sheet1'; // Change this if your sheet tab has a different name (check the tab name at bottom of sheet)

const scriptProp = PropertiesService.getScriptProperties();

// OPTION 1: If script is bound to the sheet (created from Extensions → Apps Script)
// You don't need to run initialSetup() - it's already connected
function initialSetup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty('key', activeSpreadsheet.getId());
  Logger.log('Setup complete. Sheet ID: ' + activeSpreadsheet.getId());
  return 'Setup complete!';
}

// OPTION 2: If script is standalone (created from script.google.com)
// Use this function to connect to your specific sheet
function connectToSheet() {
  scriptProp.setProperty('key', SHEET_ID);
  Logger.log('Connected to sheet ID: ' + SHEET_ID);
  return 'Connected to sheet!';
}

// Handle GET requests (for testing/verification when accessing URL directly)
function doGet(e) {
  try {
    let sheetId = scriptProp.getProperty('key');
    
    if (!sheetId) {
      sheetId = SHEET_ID;
      scriptProp.setProperty('key', SHEET_ID);
    }
    
    const doc = SpreadsheetApp.openById(sheetId);
    const sheet = doc.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          'status': 'error',
          'message': 'Sheet "' + sheetName + '" not found',
          'availableSheets': doc.getSheets().map(s => s.getName())
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const lastRow = sheet.getLastRow();
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        'status': 'success',
        'message': 'Google Apps Script is working correctly!',
        'sheetId': sheetId,
        'sheetName': sheetName,
        'headers': headers,
        'totalRows': lastRow,
        'instructions': 'This script handles POST requests from your contact form. Form submissions will be saved to the sheet.'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        'status': 'error',
        'message': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// This function handles form submissions
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // Get the spreadsheet
    let sheetId = scriptProp.getProperty('key');
    
    // If not set, use the SHEET_ID constant
    if (!sheetId) {
      sheetId = SHEET_ID;
      scriptProp.setProperty('key', SHEET_ID);
    }

    const doc = SpreadsheetApp.openById(sheetId);
    const sheet = doc.getSheetByName(sheetName);
    
    if (!sheet) {
      throw new Error('Sheet "' + sheetName + '" not found. Check sheet name. Available sheets: ' + doc.getSheets().map(s => s.getName()).join(', '));
    }

    // Get headers from first row
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Headers found: ' + headers.join(', '));

    // Get the next empty row
    const nextRow = sheet.getLastRow() + 1;

    // Map form data to sheet columns
    // Expected columns: Timestamp, Name, Email, Phone, Message
    const newRow = headers.map(function(header) {
      if (header === 'Timestamp') {
        return new Date();
      } else {
        // Get value from form (case-insensitive match)
        const headerLower = header.toLowerCase().trim();
        let value = '';
        
        // Try to find matching parameter
        for (const key in e.parameter) {
          if (key.toLowerCase().trim() === headerLower) {
            value = e.parameter[key];
            break;
          }
        }
        
        Logger.log('Column: ' + header + ', Value: ' + value);
        return value || '';
      }
    });

    // Write data to sheet
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);
    
    Logger.log('Data saved to row: ' + nextRow);
    Logger.log('Saved data: ' + newRow.join(' | '));

    return ContentService
      .createTextOutput(JSON.stringify({ 
        'result': 'success', 
        'row': nextRow,
        'message': 'Data saved successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        'result': 'error', 
        'error': error.toString(),
        'message': 'Failed to save data: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Test function to verify setup
function testConnection() {
  try {
    let sheetId = scriptProp.getProperty('key');
    
    if (!sheetId) {
      sheetId = SHEET_ID;
      scriptProp.setProperty('key', SHEET_ID);
    }
    
    const doc = SpreadsheetApp.openById(sheetId);
    const sheet = doc.getSheetByName(sheetName);
    
    if (!sheet) {
      const availableSheets = doc.getSheets().map(s => s.getName()).join(', ');
      return 'ERROR: Sheet "' + sheetName + '" not found. Available sheets: ' + availableSheets;
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const expectedHeaders = ['Timestamp', 'Name', 'Email', 'Phone', 'Message'];
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    
    let result = 'SUCCESS! Connected to sheet.\n';
    result += 'Sheet ID: ' + sheetId + '\n';
    result += 'Sheet Name: ' + sheetName + '\n';
    result += 'Headers found: ' + headers.join(', ');
    
    if (missingHeaders.length > 0) {
      result += '\nWARNING: Missing headers: ' + missingHeaders.join(', ');
      result += '\nExpected: Timestamp, Name, Email, Phone, Message';
    }
    
    return result;
  } catch (error) {
    return 'ERROR: ' + error.toString();
  }
}
