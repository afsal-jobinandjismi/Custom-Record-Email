/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */


/************************************************************************************************ 
 *  
 * OTP-9680 : Custom form to capture customer data and link to existing customer records
 * 
************************************************************************************************* 
 * 
 * Author: Jobin and Jismi IT Services 
 * 
 * Date Created : 24-October-2025 
 * 
 * Description : This User event script allows to check whether a customer exist with given email id and 
 * if found customer will be linked to custom record and if there is an entry in custom record email is
 * send to admin and to corresponding sales rep if sales rep exist.
 * 
 * REVISION HISTORY
 *
 * @version 1.0 : 24-October-2025 :  The initial build was created by JJ0414
 * 
*************************************************************************************************/

define(['N/record', 'N/search', 'N/email', 'N/runtime', 'N/log'], 
  
  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * check whether a customer exist with given email id and 
  * if found customer will be linked to custom record and if there is an entry in custom record email is
  * send to admin and to corresponding sales rep if sales rep exist.
  * 
  * 
  */

  function(record, search, email, runtime, log) {
  const ADMIN_ID = -5;

  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * check whether a customer exist with given email id and 
  * 
  * 
  * 
  */

 
  function findCustomerByEmail(emailValue) {
    try {
      const customerSearch = search.create({
        type: search.Type.CUSTOMER,
        filters: [['email', 'is', emailValue]],
        columns: ['internalid', 'salesrep']
      });
 
      const result = customerSearch.run().getRange({ start: 0, end: 1 });
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      log.error({ title: 'Customer Search Error', details: error });
      return null;
    }
  }

  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * If a customer is found, link the custom record to the customer. 
  * 
  */

 
  function linkCustomerToEnquiry(enquiryId, customerId) {
    try {
      const enquiryRecord = record.load({
        type: 'customrecordjj_customerdata',
        id: enquiryId,
        isDynamic: true
      });
 
      enquiryRecord.setValue({
        fieldId: 'custrecordjj_reference',
        value: customerId
      });
 
      enquiryRecord.save();
    } catch (error) {
      log.error({ title: 'Linking Error', details: error });
    }
  }

  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * Notify admin when a new enquiry is created.
  * 
  */

 
  function notifyAdmin(name, emailValue, subject, message) {
    try {
      email.send({
        author: runtime.getCurrentUser().id,
        recipients: ADMIN_ID,
        subject: 'New Customer Enquiry',
        body: `Name: ${name}\nEmail: ${emailValue}\nSubject: ${subject}\nMessage: ${message}`
      });
    } catch (error) {
      log.error({ title: 'Admin Notification Error', details: error });
    }
  }

  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * Notify the sales representative when a new enquiry is linked to their customer.
  * 
  */

 
  function notifySalesRep(salesRepId, name, emailValue, subject, message) {
    try {
      email.send({
        author: runtime.getCurrentUser().id,
        recipients: salesRepId,
        subject: 'Customer Enquiry Received',
        body: `Customer: ${name} (${emailValue})\nSubject: ${subject}\nMessage: ${message}`
      });
    } catch (error) {
      log.error({ title: 'Sales Rep Notification Error', details: error });
    }
  }

  /**
  * Defines the Suitelet script trigger point.
  * @param {Object} scriptContext
  * @param {ServerRequest} scriptContext.request - Incoming request
  * @param {ServerResponse} scriptContext.response - Suitelet response
  * @since 2015.2
  * Here we handle the afterSubmit event to process the custom record after it is created and link to customer if exist
  * and send notifications.
  * 
  * 
  */

 
  function afterSubmit(context) {
    if (context.type !== context.UserEventType.CREATE) return;
 
    try {
      const newRecord = context.newRecord;
      const emailValue = newRecord.getValue('custrecordjj_customeremail');
      const nameValue = newRecord.getValue('custrecordjj_customername');
      const subjectValue = newRecord.getValue('custrecordjj_subject');
      const messageValue = newRecord.getValue('custrecordjj_message');
 
      if (!emailValue) return;
 
      notifyAdmin(nameValue, emailValue, subjectValue, messageValue);
 
      const customer = findCustomerByEmail(emailValue);
      if (customer) {
        const customerId = customer.getValue('internalid');
        const salesRepId = customer.getValue('salesrep');
 
        linkCustomerToEnquiry(newRecord.id, customerId);
 
        if (salesRepId) {
          notifySalesRep(salesRepId, nameValue, emailValue, subjectValue, messageValue);
        }
      }
    } catch (error) {
      log.error({ title: 'afterSubmit Error', details: error });
    }
  }
 
  return {
    afterSubmit: afterSubmit
  };
});
 
 