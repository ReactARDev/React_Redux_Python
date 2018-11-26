import { apiUrl, gaApiUrl, dataApiUrl, slotDataApiUrl, iframeApiKey } from './config';
import _ from 'lodash';
import moment from 'moment';
import { category_to_api, categories_skipped_in_date_search } from './utils/category';
import request from 'reqwest';
import Bugsnag from 'bugsnag-js';
import { safe_ga, safe_mixpanel_track } from './utils/analytics';
import querystring from 'querystring';
import { INSIGHTS_PARAMS } from './utils/insights';

export const REQUEST_DOCUMENTS = 'REQUEST_DOCUMENTS';
export const REQUEST_DOCUMENTS_BEFORE = 'REQUEST_DOCUMENTS_BEFORE';
export const REQUEST_DOCUMENTS_AFTER = 'REQUEST_DOCUMENTS_AFTER';
export const RECEIVE_DOCUMENTS = 'RECEIVE_DOCUMENTS';
export const REQUEST_SEARCH_RESULTS_RELEVANCE = 'REQUEST_SEARCH_RESULTS_RELEVANCE';
export const RECEIVE_SEARCH_RESULTS_RELEVANCE = 'RECEIVE_SEARCH_RESULTS_RELEVANCE';
export const REQUEST_SEARCH_RESULTS_FILTER = 'REQUEST_SEARCH_RESULTS_FILTER';
export const RECEIVE_SEARCH_RESULTS_FILTER = 'RECEIVE_SEARCH_RESULTS_FILTER';
export const RECEIVE_DOCUMENTS_BEFORE = 'RECEIVE_DOCUMENTS_BEFORE';
export const RECEIVE_DOCUMENTS_AFTER = 'RECEIVE_DOCUMENTS_AFTER';
export const REQUEST_FULL_DOCUMENTS = 'REQUEST_FULL_DOCUMENTS';
export const RECEIVE_FULL_DOCUMENTS = 'RECEIVE_FULL_DOCUMENTS';
export const CLEAR_DOCUMENTS = 'CLEAR_DOCUMENTS';
export const CHANGE_DOCUMENT_VIEW = 'CHANGE_DOCUMENT_VIEW';
export const CHANGE_SEARCH_PARAMS = 'CHANGE_SEARCH_PARAMS';
export const CHANGE_SELECTED_ITEM = 'CHANGE_SELECTED_ITEM';
export const CHANGE_BULK_SELECTED_ITEM = 'CHANGE_BULK_SELECTED_ITEM';
export const CLEAR_SELECTED_ITEMS = 'CLEAR_SELECTED_ITEMS';
export const CLEAR_BULK_SELECTED_ITEMS = 'CLEAR_BULK_SELECTED_ITEMS';
export const INITIATE_PENDING_ACTION = 'INITIATE_PENDING_ACTION';
export const COMPLETE_PENDING_ACTION = 'COMPLETE_PENDING_ACTION';
export const OPEN_OVERLAY = 'OPEN_OVERLAY';
export const CLOSE_OVERLAY = 'CLOSE_OVERLAY';
export const SET_FIRST_TIMELINE_VIEW = 'SET_FIRST_TIMELINE_VIEW';
export const MARK_DOCUMENT_READ = 'MARK_DOCUMENT_READ';
export const MARKED_DOCUMENT_AS_READ = 'MARKED_DOCUMENT_AS_READ';
export const MARK_DOCUMENT_BOOKMARKED = 'MARK_DOCUMENT_BOOKMARKED';
export const MARKED_DOCUMENT_AS_BOOKMARKED = 'MARKED_DOCUMENT_AS_BOOKMARKED';
export const FOLLOW_AGENCIES = 'FOLLOW_AGENCIES';
export const FOLLOWED_AGENCIES = 'FOLLOWED_AGENCIES';
export const ADD_ERROR = 'ADD_ERROR';
export const CLEAR_ERRORS = 'CLEAR_ERRORS';
export const REQUEST_CURRENT_USER = 'REQUEST_CURRENT_USER';
export const RECEIVE_CURRENT_USER = 'RECEIVE_CURRENT_USER';
export const MODIFY_CURRENT_USER = 'MODIFY_CURRENT_USER';
export const MODIFIED_CURRENT_USER = 'MODIFIED_CURRENT_USER';
export const REQUEST_ALL_USERS = 'REQUEST_ALL_USERS';
export const RECEIVE_ALL_USERS = 'RECEIVE_ALL_USERS';
export const REQUEST_ALL_ANNOTATION_TASKS = 'REQUEST_ALL_ANNOTATION_TASKS';
export const RECEIVE_ALL_ANNOTATION_TASKS = 'RECEIVE_ALL_ANNOTATION_TASKS';
export const CREATE_ANNOTATION_TASK = 'CREATE_ANNOTATION_TASK';
export const ANNOTATION_TASK_CREATED = 'ANNOTATION_TASK_CREATED';
export const UPDATE_ANNOTATION_TASK = 'UPDATE_ANNOTATION_TASK';
export const ANNOTATION_TASK_UPDATED = 'ANNOTATION_TASK_UPDATED';
export const DELETE_ANNOTATION_TASK = 'DELETE_ANNOTATION_TASK';
export const ANNOTATION_TASK_DELETED = 'ANNOTATION_TASK_DELETED';
export const REQUEST_ALL_PUBLICATIONS = 'REQUEST_ALL_PUBLICATIONS';
export const RECEIVE_ALL_PUBLICATIONS = 'RECEIVE_ALL_PUBLICATIONS';
export const UPDATE_PUBLICATION = 'UPDATE_PUBLICATION';
export const PUBLICATION_UPDATED = 'PUBLICATION_UPDATED';
export const REQUEST_STATISTICS = 'REQUEST_STATISTICS';
export const RECEIVE_STATISTICS = 'RECEIVE_STATISTICS';
export const REQUEST_SPECIFIED_USER = 'REQUEST_SPECIFIED_USER';
export const RECEIVE_SPECIFIED_USER = 'RECEIVE_SPECIFIED_USER';
export const MODIFY_SPECIFIED_USER = 'MODIFY_SPECIFIED_USER';
export const MODIFIED_SPECIFIED_USER = 'MODIFIED_SPECIFIED_USER';
export const CLEAR_CURRENT_USER_UPDATED_STATE = 'CLEAR_CURRENT_USER_UPDATED_STATE';
export const REQUEST_AGENCIES = 'REQUEST_AGENCIES';
export const RECEIVE_AGENCIES = 'RECEIVE_AGENCIES';
export const REQUEST_TAGS = 'REQUEST_TAGS';
export const RECEIVE_TAGS = 'RECEIVE_TAGS';
export const REQUEST_CATEGORIES = 'REQUEST_CATEGORIES';
export const RECEIVE_CATEGORIES = 'RECEIVE_CATEGORIES';
export const REQUEST_SPIDER_NAMES = 'REQUEST_SPIDER_NAMES';
export const RECEIVE_SPIDER_NAMES = 'RECEIVE_SPIDER_NAMES';
export const REQUEST_PROVENANCES = 'REQUEST_PROVENANCES';
export const RECEIVE_PROVENANCES = 'RECEIVE_PROVENANCES';
export const REQUEST_INSIGHTS_GRAPH_DATA = 'REQUEST_INSIGHTS_GRAPH_DATA';
export const RECEIVE_INSIGHTS_GRAPH_DATA = 'RECEIVE_INSIGHTS_GRAPH_DATA';
export const REQUEST_DOCKET_TIMELINE = 'REQUEST_DOCKET_TIMELINE';
export const RECEIVE_DOCKET_TIMELINE = 'RECEIVE_DOCKET_TIMELINE';
export const REQUEST_RECENT_ACTIVITY = 'REQUEST_RECENT_ACTIVITY';
export const RECEIVE_RECENT_ACTIVITY = 'RECEIVE_RECENT_ACTIVITY';
export const REQUEST_AUTO_COMPLETE = 'REQUEST_AUTO_COMPLETE';
export const RECEIVE_AUTO_COMPLETE = 'RECEIVE_AUTO_COMPLETE';
export const CLEAR_AUTO_COMPLETE = 'CLEAR_AUTO_COMPLETE';
export const CHANGE_EXPAND_STATUS = 'CHANGE_EXPAND_STATUS';
export const SAVE_UNBOOKMARKED_DOCUMENT = 'SAVE_UNBOOKMARKED_DOCUMENT';
export const REQUEST_MENTION = 'REQUEST_MENTION';
export const RECEIVE_MENTION = 'RECEIVE_MENTION';
export const ADD_NEW_FOLDER = 'ADD_NEW_FOLDER';
export const NEW_FOLDER_ADDED = 'NEW_FOLDER_ADDED';
export const REQUEST_FOLDERS = 'REQUEST_FOLDERS';
export const RECEIVE_FOLDERS = 'RECEIVE_FOLDERS';
export const ADDING_DOCUMENTS_TO_FOLDER = 'ADDING_DOCUMENTS_TO_FOLDER';
export const DOCUMENTS_ADDED_TO_FOLDER = 'DOCUMENTS_ADDED_TO_FOLDER';
export const CHANGE_SELECTED_FOLDER = 'CHANGE_SELECTED_FOLDER';
export const CLEAR_SELECTED_FOLDER = 'CLEAR_SELECTED_FOLDER';
export const REQUEST_RELATED_DOCUMENT_COUNT = 'REQUEST_RELATED_DOCUMENT_COUNT';
export const RECEIVE_RELATED_DOCUMENT_COUNT = 'RECEIVE_RELATED_DOCUMENT_COUNT';
export const UPDATE_DOCUMENT_TAG = 'UPDATE_DOCUMENT_TAG';
export const UPDATED_DOCUMENT_TAG = 'UPDATED_DOCUMENT_TAG';
export const CREATE_NEW_TAG = 'CREATE_NEW_TAG';
export const CREATED_NEW_TAG = 'CREATED_NEW_TAG';
export const REQUEST_FOLDER_DOCUMENTS = 'REQUEST_FOLDER_DOCUMENTS';
export const RECEIVE_FOLDER_DOCUMENTS = 'RECEIVE_FOLDER_DOCUMENTS';
export const OPEN_FOLDER_MENU = 'OPEN_FOLDER_MENU';
export const CLOSE_FOLDER_MENU = 'CLOSE_FOLDER_MENU';
export const DELETE_USER_FOLDER = 'DELETE_USER_FOLDER';
export const USER_FOLDER_DELETED = 'USER_FOLDER_DELETED';
export const DELETE_USER = 'DELETE_USER';
export const USER_DELETED = 'USER_DELETED';
export const DELETE_DOCUMENTS_FROM_FOLDERS = 'DELETE_DOCUMENTS_FROM_FOLDERS';
export const DOCUMENTS_DELETED_FROM_FOLDERS = 'DOCUMENTS_DELETED_FROM_FOLDERS';
export const UPDATE_FOLDER_NAME = 'UPDATE_FOLDER_NAME';
export const FOLDER_NAME_UPDATED = 'FOLDER_NAME_UPDATED';
export const CLEAR_FOLDER_DOCUMENTS = 'CLEAR_FOLDER_DOCUMENTS';
export const REQUEST_ALL_DOCUMENTS = 'REQUEST_ALL_DOCUMENTS';
export const RECEIVE_ALL_DOCUMENTS = 'RECEIVE_ALL_DOCUMENTS';
export const UPDATE_FOLDER_MODAL_STATUS = 'UPDATE_FOLDER_MODAL_STATUS';
export const FLAG_DOCUMENT = 'FLAG_DOCUMENT';
export const FLAGGED_DOCUMENT = 'FLAGGED_DOCUMENT';
export const CLEAR_STATE_CODE = 'CLEAR_STATE_CODE';
export const UPDATE_DOCUMENT = 'UPDATE_DOCUMENT';
export const DOCUMENT_UPDATED = 'DOCUMENT_UPDATED';
export const REQUEST_GOOGLE_ANALYTICS_REPORTS = 'REQUEST_GOOGLE_ANALYTICS_REPORTS';
export const RECEIVE_GOOGLE_ANALYTICS_REPORTS = 'RECEIVE_GOOGLE_ANALYTICS_REPORTS';
export const REQUEST_FOLLOWED_ENTITIES = 'REQUEST_FOLLOWED_ENTITIES';
export const RECIEVE_FOLLOWED_ENTITIES = 'RECIEVE_FOLLOWED_ENTITIES';
export const OPEN_SOURCE_SELECTION = 'OPEN_SOURCE_SELECTION';
export const CLOSE_SOURCE_SELECTION = 'CLOSE_SOURCE_SELECTION';
export const FOLLOWING_ENTITIES = 'FOLLOWING_ENTITIES';
export const ENTITIES_FOLLOWED = 'ENTITIES_FOLLOWED';
export const SHOW_EMPTY_TIMELINE = 'SHOW_EMPTY_TIMELINE';
export const HIDE_EMPTY_TIMELINE = 'HIDE_EMPTY_TIMELINE';
export const REQUEST_USER_CREATED_DOCUMENTS = 'REQUEST_USER_CREATED_DOCUMENTS';
export const RECEIVE_USER_CREATED_DOCUMENTS = 'RECEIVE_USER_CREATED_DOCUMENTS';
export const CREATE_DOCUMENT = 'CREATE_DOCUMENT';
export const DOCUMENT_CREATED = 'DOCUMENT_CREATED';
export const REQUEST_NEW_DOCUMENT_URL_HEADERS = 'REQUEST_NEW_DOCUMENT_URL_HEADERS';
export const RECEIVE_NEW_DOCUMENT_URL_HEADERS = 'RECEIVE_NEW_DOCUMENT_URL_HEADERS';
export const REQUEST_MARKETING_CAMPAIGNS = 'REQUEST_MARKETING_CAMPAIGNS';
export const RECIEVE_MARKETING_CAMPAIGNS = 'RECIEVE_MARKETING_CAMPAIGNS';
export const CREATE_MARKETING_CAMPAIGN = 'CREATE_MARKETING_CAMPAIGN';
export const CREATED_MARKETING_CAMPAIGN = 'CREATED_MARKETING_CAMPAIGN';
export const UPDATE_MARKETING_CAMPAIGN = 'UPDATE_MARKETING_CAMPAIGN';
export const UPDATED_MARKETING_CAMPAIGN = 'UPDATED_MARKETING_CAMPAIGN';
export const REQUEST_CAMPAIGN_DETAILS = 'REQUEST_CAMPAIGN_DETAILS';
export const RECIEVE_CAMPAIGN_DETAILS = 'RECIEVE_CAMPAIGN_DETAILS';
export const OPEN_WARNING_MODAL = 'OPEN_WARNING_MODAL';
export const CLOSE_WARNING_MODAL = 'CLOSE_WARNING_MODAL';
export const CREATE_SAVED_SEARCH = 'CREATE_SAVED_SEARCH';
export const SAVED_SEARCH_CREATED = 'SAVED_SEARCH_CREATED';
export const REQUEST_SAVED_SEARCHES = 'REQUEST_SAVED_SEARCHES';
export const RECEIVE_SAVED_SEARCHES = 'RECEIVE_SAVED_SEARCHES';
export const CLEAR_SAVED_SEARCHES = 'CLEAR_SAVED_SEARCHES';
export const DELETE_SAVED_SEARCH = 'DELETE_SAVED_SEARCH';
export const SAVED_SEARCH_DELETED = 'SAVED_SEARCH_DELETED';
export const EDIT_SAVED_SEARCH = 'EDIT_SAVED_SEARCH';
export const SAVED_SEARCH_EDITED = 'SAVED_SEARCH_EDITED';
export const CLEAR_DOC_REF = 'CLEAR_DOC_REF';
export const DISPLAY_FILTERS = 'DISPLAY_FILTERS';
export const HIDE_FILTERS = 'HIDE_FILTERS';
export const TOGGLE_FILTERS = 'TOGGLE_FILTERS';
export const REQUEST_JURISDICTIONS = 'REQUEST_JURISDICTIONS';
export const RECEIVE_JURISDICTIONS = 'RECEIVE_JURISDICTIONS';
export const CHANGE_SUBMENU_TARGET = 'CHANGE_SUBMENU_TARGET';
export const REQUEST_SEARCH_QUERIES = 'REQUEST_SEARCH_QUERIES';
export const RECEIVE_SEARCH_QUERIES = 'RECEIVE_SEARCH_QUERIES';
export const REQUEST_POPULAR_DOCS = 'REQUEST_POPULAR_DOCS';
export const RECEIVE_POPULAR_DOCS = 'RECEIVE_POPULAR_DOCS';
export const REQUEST_POPULAR_SOURCES = 'REQUEST_POPULAR_SOURCES';
export const RECEIVE_POPULAR_SOURCES = 'RECEIVE_POPULAR_SOURCES';
export const REQUEST_SIMPLE_DOCUMENTS = 'REQUEST_SIMPLE_DOCUMENTS';
export const RECEIVE_SIMPLE_DOCUMENTS = 'RECEIVE_SIMPLE_DOCUMENTS';
export const SET_DOCS_TO_SELECT = 'SET_DOCS_TO_SELECT';
export const SET_MOBILE = 'SET_MOBILE';
export const REQUEST_STATE_CODE = 'REQUEST_STATE_CODE';
export const RECEIVE_STATE_CODE = 'RECEIVE_STATE_CODE';
export const CREATE_SEARCH_QUERY = 'CREATE_SEARCH_QUERY';
export const SEARCH_QUERY_CREATED = 'SEARCH_QUERY_CREATED';
export const FETCH_FROM_STORE = 'FETCH_FROM_STORE';
export const REQUEST_CONTRIBUTOR_POINTS = 'REQUEST_CONTRIBUTOR_POINTS';
export const RECEIVE_CONTRIBUTOR_POINTS = 'RECEIVE_CONTRIBUTOR_POINTS';
export const RATE_SEARCH_RESULT = 'RATE_SEARCH_RESULT';
export const SEARCH_RESULT_RATED = 'SEARCH_RESULT_RATED';
export const UPDATE_USER_POINTS = 'UPDATE_USER_POINTS';
export const USER_POINTS_UPDATED = 'USER_POINTS_UPDATED';
export const HIGHLIGHT_SEARCH = 'HIGHLIGHT_SEARCH';
export const REQUEST_HIDDEN_DOCUMENTS = 'REQUEST_HIDDEN_DOCUMENTS';
export const RECEIVE_HIDDEN_DOCUMENTS = 'RECEIVE_HIDDEN_DOCUMENTS';
export const REQUEST_ANNOTATION_JOBS = 'REQUEST_ANNOTATION_JOBS';
export const RECEIVE_ANNOTATION_JOBS = 'RECEIVE_ANNOTATION_JOBS';
export const CREATE_ANNOTATIONS_FOR_JOB = 'CREATE_ANNOTATIONS_FOR_JOB';
export const ANNOTATIONS_FOR_JOB_CREATED = 'ANNOTATIONS_FOR_JOB_CREATED';
export const REQUEST_TERM_SAMPLING_GROUPS = 'REQUEST_TERM_SAMPLING_GROUPS';
export const RECEIVE_TERM_SAMPLING_GROUPS = 'RECEIVE_TERM_SAMPLING_GROUPS';
export const REQUEST_DOCUMENT_DETAILS = 'REQUEST_DOCUMENT_DETAILS';
export const RECEIVE_DOCUMENT_DETAILS = 'RECEIVE_DOCUMENT_DETAILS';
export const CREATE_TERM_SAMPLING_GROUP = 'CREATE_TERM_SAMPLING_GROUP';
export const TERM_SAMPLING_GROUP_CREATED = 'TERM_SAMPLING_GROUP_CREATED';
export const UPDATE_TERM_SAMPLING_GROUP = 'UPDATE_TERM_SAMPLING_GROUP';
export const TERM_SAMPLING_GROUP_UPDATED = 'TERM_SAMPLING_GROUP_UPDATED';
export const REQUEST_ANNOTATION_STATISTICS = 'REQUEST_ANNOTATION_STATISTICS';
export const RECEIVE_ANNOTATION_STATISTICS = 'RECEIVE_ANNOTATION_STATISTICS';
export const CREATE_SUBSCRIPTION = 'CREATE_SUBSCRIPTION';
export const SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED';
export const REQUEST_ALL_ANNOTATION_JOBS = 'REQUEST_ALL_ANNOTATION_JOBS';
export const RECEIVE_ALL_ANNOTATION_JOBS = 'RECEIVE_ALL_ANNOTATION_JOBS';
export const REQUEST_SUBSCRIPTIONS = 'REQUEST_SUBSCRIPTIONS';
export const RECEIVE_SUBSCRIPTIONS = 'RECEIVE_SUBSCRIPTIONS';
export const REQUEST_INSIGHTS_CSV = 'REQUEST_INSIGHTS_CSV';
export const RECEIVE_INSIGHTS_CSV = 'RECEIVE_INSIGHTS_CSV';
export const CREATE_INVOICE_REQUEST = 'CREATE_INVOICE_REQUEST';
export const INVOICE_REQUEST_CREATED = 'INVOICE_REQUEST_CREATED';
export const REQUEST_ANNOTATION_JOB_BY_ID = 'REQUEST_ANNOTATION_JOB_BY_ID';
export const RECEIVE_ANNOTATION_JOB_BY_ID = 'RECEIVE_ANNOTATION_JOB_BY_ID';
export const RESEND_CONFIRMATION_EMAIL = 'RESEND_CONFIRMATION_EMAIL';
export const RESENT_CONFIRMATION_EMAIL = 'RESENT_CONFIRMATION_EMAIL';
export const NEW_NOTIFICATIONS_STATUS = 'NEW_NOTIFICATIONS_STATUS';
export const FOLLOW_TOPICS = 'FOLLOW_TOPICS';
export const FOLLOWED_TOPICS = 'FOLLOWED_TOPICS';
export const REQUEST_TOPICS = 'REQUEST_TOPICS';
export const RECEIVE_TOPICS = 'RECEIVE_TOPICS';
export const REQUEST_CONTRIBUTOR_STATISTICS = 'REQUEST_CONTRIBUTOR_STATISTICS';
export const RECEIVE_CONTRIBUTOR_STATISTICS = 'RECEIVE_CONTRIBUTOR_STATISTICS';
export const ADD_BANNER = 'ADD_BANNER';
export const REQUEST_CONTRIBUTOR_REVIEWS_COUNT = 'REQUEST_CONTRIBUTOR_REVIEWS_COUNT';
export const RECEIVE_CONTRIBUTOR_REVIEWS_COUNT = 'RECEIVE_CONTRIBUTOR_REVIEWS_COUNT';
export const REQUEST_All_SKIPPED_ANNOTATIONS = 'REQUEST_All_SKIPPED_ANNOTATIONS';
export const RECEIVE_All_SKIPPED_ANNOTATIONS = 'RECEIVE_All_SKIPPED_ANNOTATIONS';
export const REQUEST_ALL_SUBSCRIPTIONS = 'REQUEST_ALL_SUBSCRIPTIONS';
export const RECEIVE_ALL_SUBSCRIPTIONS = 'RECEIVE_ALL_SUBSCRIPTIONS';
export const UPDATE_SUBSCRIPTION = 'UPDATE_SUBSCRIPTION';
export const SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED';
export const REQUEST_ALL_PLANS = 'REQUEST_ALL_PLANS';
export const RECEIVE_ALL_PLANS = 'RECEIVE_ALL_PLANS';
export const REQUEST_ALL_TOPICS = 'REQUEST_ALL_TOPICS';
export const RECEIVE_ALL_TOPICS = 'RECEIVE_ALL_TOPICS';
export const REQUEST_TOPICS_STATS = 'REQUEST_TOPICS_STATS';
export const RECEIVE_TOPICS_STATS = 'RECEIVE_TOPICS_STATS';
export const CREATE_TOPIC = 'CREATE_TOPIC';
export const TOPIC_CREATED = 'TOPIC_CREATED';
export const UPDATE_TOPIC = 'UPDATE_TOPIC';
export const TOPIC_UPDATED = 'TOPIC_UPDATED';
export const REQUEST_TEAMS = 'REQUEST_TEAMS';
export const RECEIVE_TEAMS = 'RECEIVE_TEAMS';
export const REQUEST_ADD_TEAMS = 'REQUEST_ADD_TEAMS';
export const RECEIVE_ADD_TEAMS = 'RECEIVE_ADD_TEAMS';
export const REQUEST_ADD_TEAM_MEMBER = 'REQUEST_ADD_TEAM_MEMBER';
export const RECEIVE_ADD_TEAM_MEMBER = 'RECEIVE_ADD_TEAM_MEMBER';
export const DELETE_CONFIRM_FOLDER_OPEN = 'DELETE_CONFIRM_FOLDER_OPEN';
export const DELETE_CONFIRM_FOLDER_CLOSE = 'DELETE_CONFIRM_FOLDER_CLOSE';
export const REQUEST_ADD_SHARED_FOLDER = 'REQUEST_ADD_SHARED_FOLDER';
export const RECEIVE_ADD_SHARED_FOLDER = 'RECEIVE_ADD_SHARED_FOLDER';
export const SHARE_FOLDER_MENU_OPEN = 'SHARE_FOLDER_MENU_OPEN';
export const SHARE_FOLDER_MENU_CLOSE = 'SHARE_FOLDER_MENU_CLOSE';
export const REQUEST_ALL_TEAM_MEMBERS = 'REQUEST_ALL_TEAM_MEMBERS';
export const RECEIVE_ALL_TEAM_MEMBERS = 'RECEIVE_ALL_TEAM_MEMBERS';
export const REQUEST_ADD_SHARED_FOLDER_USERS = 'REQUEST_ADD_SHARED_FOLDER_USERS';
export const RECEIVE_ADD_SHARED_FOLDER_USERS = 'RECEIVE_ADD_SHARED_FOLDER_USERS';
export const COPY_FOLDER_MENU_OPEN = 'COPY_FOLDER_MENU_OPEN';
export const COPY_FOLDER_MENU_CLOSE = 'COPY_FOLDER_MENU_CLOSE';
export const REQUEST_UPDATE_SHARED_FOLDER_USERS = 'REQUEST_UPDATE_SHARED_FOLDER_USERS';
export const RECEIVE_UPDATE_SHARED_FOLDER_USERS = 'RECEIVE_UPDATE_SHARED_FOLDER_USERS';
export const REQUEST_ALL_SHARED_FOLDERS = 'REQUEST_ALL_SHARED_FOLDERS';
export const RECEIVE_ALL_SHARED_FOLDERS = 'RECEIVE_ALL_SHARED_FOLDERS';
export const REQUEST_INCOMPLETE_DOCUMENTS = 'REQUEST_INCOMPLETE_DOCUMENTS';
export const RECEIVE_INCOMPLETE_DOCUMENTS = 'RECEIVE_INCOMPLETE_DOCUMENTS';
export const REQUEST_SEARCH_FILTER_AGENCIES = 'REQUEST_SEARCH_FILTER_AGENCIES';
export const RECIEVE_SEARCH_FILTER_AGENCIES = 'RECIEVE_SEARCH_FILTER_AGENCIES';
export const SKIP_ONBOARDING = 'SKIP_ONBOARDING';
export const CLEAR_SKIP_ONBOARDING = 'CLEAR_SKIP_ONBOARDING';
export const REQUEST_ANNOTATION_TASK_TOPIC_GROUPS = 'REQUEST_ANNOTATION_TASK_TOPIC_GROUPS';
export const RECEIVE_ANNOTATION_TASK_TOPIC_GROUPS = 'RECEIVE_ANNOTATION_TASK_TOPIC_GROUPS';
export const EDIT_ANNOTATION_TOPIC_GROUP = 'EDIT_ANNOTATION_TOPIC_GROUP';
export const ANNOTATION_TOPIC_GROUP_EDITED = 'ANNOTATION_TOPIC_GROUP_EDITED';
export const REQUEST_AGGREGATED_ANNOTATIONS = 'REQUEST_AGGREGATED_ANNOTATIONS';
export const RECEIVE_AGGREGATED_ANNOTATIONS = 'RECEIVE_AGGREGATED_ANNOTATIONS';
export const EDIT_AGGREGATED_ANNOTATION = 'EDIT_AGGREGATED_ANNOTATION';
export const AGGREGATED_ANNOTATION_EDITED = 'AGGREGATED_ANNOTATION_EDITED';
export const REQUEST_REMOVE_TEAM_MEMBER = 'REQUEST_REMOVE_TEAM_MEMBER';
export const RECIEVE_REMOVE_TEAM_MEMBER = 'RECIEVE_REMOVE_TEAM_MEMBER';
export const OPEN_ADD_FOLDER_MENU = 'OPEN_ADD_FOLDER_MENU';
export const CLOSE_ADD_FOLDER_MENU = 'CLOSE_ADD_FOLDER_MENU';
export const REQUEST_SOURCES = 'REQUEST_SOURCES';
export const RECEIVE_SOURCES = 'RECEIVE_SOURCES';
export const REQUEST_SLOT_INFO_FOR_DOC = 'REQUEST_SLOT_INFO_FOR_DOC';
export const RECEIVE_SLOT_INFO_FOR_DOC = 'RECEIVE_SLOT_INFO_FOR_DOC';

function requestDocuments(params, sorts, type) {
  return {
    type,
    params
  };
}

function requestSearchResults(params, type) {
  return {
    type,
    params
  };
}

function requestDocumentsAfter(type, params, sorts) {
  return {
    type: REQUEST_DOCUMENTS_AFTER,
    params
  };
}

function requestDocumentsBefore(params, sorts) {
  return {
    type: REQUEST_DOCUMENTS_BEFORE,
    params
  };
}

function mungeDocumentResponses(extra_params_list, responses) {
  const data = {};

  extra_params_list.forEach((extra_params, i) => {
    data[extra_params.sort] = {
      documents: responses[i].documents,
      count: responses[i].count
    };
  });

  return data;
}

function receiveDocuments(params, sorts, responses, type) {
  const data = mungeDocumentResponses(sorts, responses);
  return {
    type,
    params,
    data
  };
}

function receiveSearchResults(data, type) {
  return {
    type,
    data
  };
}

function receiveDocumentsAfter(params, sorts, responses) {
  const data = mungeDocumentResponses(sorts, responses);

  return {
    type: RECEIVE_DOCUMENTS_AFTER,
    params,
    data
  };
}

function receiveDocumentsBefore(params, extra_params_list, responses) {
  const data = mungeDocumentResponses(extra_params_list, responses);

  return {
    type: RECEIVE_DOCUMENTS_BEFORE,
    params,
    data
  };
}

export function clearDocuments() {
  return {
    type: CLEAR_DOCUMENTS,
    documents: null
  };
}

//update the UI on the status of the various modal menus used in folder-view
//used to make sure events occur only if folder modal menu is open/closed
export function updateFolderModalStatus(status) {
  return {
    type: UPDATE_FOLDER_MODAL_STATUS,
    status
  };
}

export function changeDocumentView(page, id) {
  return {
    type: CHANGE_DOCUMENT_VIEW,
    page,
    id
  };
}

// XXX: router method for new release click functionality
export function closeSourceSelection() {
  return {
    type: CLOSE_SOURCE_SELECTION
  };
}

export function openWarningModal(modal) {
  return {
    type: OPEN_WARNING_MODAL,
    modal
  };
}

export function closeWarningModal() {
  return {
    type: CLOSE_WARNING_MODAL
  };
}

export function showEmptyTimeline() {
  return {
    type: SHOW_EMPTY_TIMELINE
  };
}

export function hideEmptyTimeline() {
  return {
    type: HIDE_EMPTY_TIMELINE
  };
}

export function changeSearchParams(params) {
  return {
    type: CHANGE_SEARCH_PARAMS,
    params
  };
}

export function changeExpandStatus(dir, refs) {
  return {
    type: CHANGE_EXPAND_STATUS,
    dir,
    ...refs
  };
}

export function changeSelectedItem(id, value) {
  return {
    type: CHANGE_SELECTED_ITEM,
    id,
    value
  };
}

export function changeBulkSelectedItem(value, bulk) {
  return {
    type: CHANGE_BULK_SELECTED_ITEM,
    value,
    bulk
  };
}

export function clearSelectedItems() {
  return {
    type: CLEAR_SELECTED_ITEMS
  };
}

export function clearBulkSelectedItems() {
  return {
    type: CLEAR_BULK_SELECTED_ITEMS
  };
}

export function initiatePendingAction(data) {
  return {
    type: INITIATE_PENDING_ACTION,
    data
  };
}

export function completePendingAction() {
  return {
    type: COMPLETE_PENDING_ACTION
  };
}

export function openOverlay(data) {
  return {
    type: OPEN_OVERLAY,
    data
  };
}

export function closeOverlay() {
  return {
    type: CLOSE_OVERLAY
  };
}

export function changeSubmenuTarget(target) {
  return {
    type: CHANGE_SUBMENU_TARGET,
    target
  };
}

export function setFirstTimelineView(value) {
  return {
    type: SET_FIRST_TIMELINE_VIEW,
    value
  };
}

function requestFullDocuments(params) {
  return {
    type: REQUEST_FULL_DOCUMENTS,
    params
  };
}

function receiveFullDocuments(params, json, no_ready_update) {
  return {
    type: RECEIVE_FULL_DOCUMENTS,
    params,
    no_ready_update,
    documents: _.map(json, 'document')
  };
}

function requestStateCode() {
  return {
    type: REQUEST_STATE_CODE
  };
}

function receiveStateCode(json) {
  return {
    type: RECEIVE_STATE_CODE,
    branches: _.map(json, 'document')
  };
}

function requestDocumentDetails() {
  return {
    type: REQUEST_DOCUMENT_DETAILS
  };
}

function recieveDocumentDetails(json) {
  return {
    type: RECEIVE_DOCUMENT_DETAILS,
    document: _.map(json, 'document')[0]
  };
}

export function addError(error, component) {
  return {
    type: ADD_ERROR,
    component,
    error
  };
}

export function clearErrors(component) {
  return {
    type: CLEAR_ERRORS,
    component
  };
}

function requestCurrentUser() {
  return {
    type: REQUEST_CURRENT_USER
  };
}

function requestFolders() {
  return {
    type: REQUEST_FOLDERS
  };
}

function receiveFolders(all_folders) {
  return {
    type: RECEIVE_FOLDERS,
    personal_folders: all_folders.personal_folders,
    shared_folders: all_folders.shared_folders
  };
}

function addNewFolder() {
  return {
    type: ADD_NEW_FOLDER
  };
}

function newFolderAdded() {
  return {
    type: NEW_FOLDER_ADDED
  };
}

function addingDocumentsToFolder() {
  return {
    type: ADDING_DOCUMENTS_TO_FOLDER
  };
}

function documentsAddedToFolder() {
  return {
    type: DOCUMENTS_ADDED_TO_FOLDER
  };
}

export function changeSelectedFolder(folder) {
  return {
    type: CHANGE_SELECTED_FOLDER,
    folder
  };
}

export function clearSelectedFolder() {
  return {
    type: CLEAR_SELECTED_FOLDER
  };
}

//update the UI on the status of the folder drop down menu on doc action bar
//used to make sure events occur only if dropdown is open/closed
export function openFolderMenu() {
  return {
    type: OPEN_FOLDER_MENU
  };
}
//update the UI on the status of the folder drop down menu on doc action bar
//used to make sure events occur only if dropdown is open/closed
export function closeFolderMenu() {
  return {
    type: CLOSE_FOLDER_MENU
  };
}

export function openAddFolderMenu() {
  return {
    type: OPEN_ADD_FOLDER_MENU
  };
}

export function closeAddFolderMenu() {
  return {
    type: CLOSE_ADD_FOLDER_MENU
  };
}

function receiveCurrentUser(json) {
  Bugsnag.user = {
    email: json.user.email
  };

  return {
    type: RECEIVE_CURRENT_USER,
    user: json.user
  };
}

function requestAllUsers() {
  return {
    type: REQUEST_ALL_USERS
  };
}

function receiveAllUsers(json) {
  return {
    type: RECEIVE_ALL_USERS,
    users: json.users
  };
}

function requestAllAnnotationTasks() {
  return {
    type: REQUEST_ALL_ANNOTATION_TASKS
  };
}

function receiveAllAnnotationTasks(json) {
  return {
    type: RECEIVE_ALL_ANNOTATION_TASKS,
    annotation_tasks: json.annotation_tasks
  };
}

function requestAllPublications() {
  return {
    type: REQUEST_ALL_PUBLICATIONS
  };
}

function receiveAllPublications(json) {
  return {
    type: RECEIVE_ALL_PUBLICATIONS,
    publications: json.publications
  };
}

function requestStatistics() {
  return {
    type: REQUEST_STATISTICS
  };
}

function receiveStatistics(json) {
  return {
    type: RECEIVE_STATISTICS,
    statistics: json
  };
}

function requestAllCategories() {
  return {
    type: REQUEST_CATEGORIES
  };
}

function receiveAllCategories(json) {
  return {
    type: RECEIVE_CATEGORIES,
    categories: json
  };
}

function requestAllSpiderNames() {
  return {
    type: REQUEST_SPIDER_NAMES
  };
}

function receiveAllSpiderNames(json) {
  return {
    type: RECEIVE_SPIDER_NAMES,
    spidernames: json
  };
}

function requestAllProvenances() {
  return {
    type: REQUEST_PROVENANCES
  };
}

function receiveAllProvenances(json) {
  return {
    type: RECEIVE_PROVENANCES,
    provenances: json
  };
}

function requestAllJurisdictions() {
  return {
    type: REQUEST_JURISDICTIONS
  };
}

function receiveAllJurisdictions(json) {
  return {
    type: RECEIVE_JURISDICTIONS,
    jurisdictions: json
  };
}

function requestAllDocuments() {
  return {
    type: REQUEST_ALL_DOCUMENTS
  };
}

function receiveAllDocuments(json) {
  return {
    type: RECEIVE_ALL_DOCUMENTS,
    alldocuments: json
  };
}

function requestIncompleteDocuments() {
  return {
    type: REQUEST_INCOMPLETE_DOCUMENTS
  };
}

function receiveIncompleteDocuments(json) {
  return {
    type: RECEIVE_INCOMPLETE_DOCUMENTS,
    incomplete_documents: json
  };
}

function requestGoogleAnalyticsReports() {
  return {
    type: REQUEST_GOOGLE_ANALYTICS_REPORTS
  };
}

function receiveGoogleAnalyticsReports(json) {
  return {
    type: RECEIVE_GOOGLE_ANALYTICS_REPORTS,
    reports: json
  };
}

function requestUserCreatedDocuments() {
  return {
    type: REQUEST_USER_CREATED_DOCUMENTS
  };
}

function receiveUserCreatedDocuments(json) {
  return {
    type: RECEIVE_USER_CREATED_DOCUMENTS,
    user_created_documents: json
  };
}

function requestNewDocumentUrlHeaders() {
  return {
    type: REQUEST_NEW_DOCUMENT_URL_HEADERS
  };
}

function receiveNewDocumentUrlHeaders(json) {
  return {
    type: RECEIVE_NEW_DOCUMENT_URL_HEADERS,
    headers: json
  };
}

function requestSpecifiedUser(email) {
  return {
    type: REQUEST_SPECIFIED_USER,
    email
  };
}

function receiveSpecifiedUser(json) {
  return {
    type: RECEIVE_SPECIFIED_USER,
    user: json.user
  };
}

function modifyCurrentUser() {
  return {
    type: MODIFY_CURRENT_USER
  };
}

function modifiedCurrentUser(json) {
  return {
    type: MODIFIED_CURRENT_USER,
    user: json ? json.user : null
  };
}

function modifySpecifiedUser() {
  return {
    type: MODIFY_SPECIFIED_USER
  };
}

function modifiedSpecifiedUser(json) {
  return {
    type: MODIFIED_SPECIFIED_USER,
    user: json ? json.user : null
  };
}

function markDocumentRead(ids, read_or_unread) {
  return {
    type: MARK_DOCUMENT_READ,
    ids,
    read_or_unread
  };
}

function markDocumentBookmarked(ids, bookmarked_status) {
  return {
    type: MARK_DOCUMENT_BOOKMARKED,
    ids,
    bookmarked_status
  };
}

function markDocumentAsFlagged(id, params) {
  return {
    type: FLAG_DOCUMENT,
    id,
    params
  };
}

function markedDocumentAsFlagged(json) {
  return {
    type: FLAGGED_DOCUMENT,
    document: json ? json.document : null
  };
}

function updateDocumentData(id, params) {
  return {
    type: UPDATE_DOCUMENT,
    id,
    params
  };
}

function documentDataUpdated(json) {
  return {
    type: DOCUMENT_UPDATED,
    document: json ? json.document : null
  };
}

function markedDocumentAsRead(json) {
  return {
    type: MARKED_DOCUMENT_AS_READ,
    documents: json ? json.documents : null
  };
}

function markedDocumentAsBookmarked(json) {
  return {
    type: MARKED_DOCUMENT_AS_BOOKMARKED,
    documents: json ? json.documents : null
  };
}

function followAgenciesBegin(agencies) {
  return {
    type: FOLLOW_AGENCIES,
    agencies
  };
}

function followedAgencies(json) {
  return {
    type: FOLLOWED_AGENCIES
  };
}

export function clearCurrentUserUpdatedState() {
  return {
    type: CLEAR_CURRENT_USER_UPDATED_STATE
  };
}

function requestAgencies(following) {
  return {
    type: REQUEST_AGENCIES,
    following
  };
}

function requestFollowedEntities() {
  return {
    type: REQUEST_FOLLOWED_ENTITIES
  };
}

function requestInsightsGraphData() {
  return {
    type: REQUEST_INSIGHTS_GRAPH_DATA
  };
}

function requestAutoComplete() {
  return {
    type: REQUEST_AUTO_COMPLETE
  };
}

function receiveAutoComplete(json) {
  return {
    type: RECEIVE_AUTO_COMPLETE,
    autocompletes: json.results
  };
}

export function clearAutoComplete() {
  return {
    type: CLEAR_AUTO_COMPLETE,
    autocompletes: null
  };
}

export function clearFolderDocuments() {
  return {
    type: CLEAR_FOLDER_DOCUMENTS
  };
}

function receiveAgencies(json, following) {
  return {
    type: RECEIVE_AGENCIES,
    agencies: json.agencies,
    following
  };
}

function recieveFollowedEntities(json) {
  return {
    type: RECIEVE_FOLLOWED_ENTITIES,
    followed_entities: json.followed_entities
  };
}

function requestTags() {
  return {
    type: REQUEST_TAGS
  };
}

function receiveTags(json) {
  return {
    type: RECEIVE_TAGS,
    response: json
  };
}

function receiveInsightsGraphData(aggregations, json) {
  return {
    type: RECEIVE_INSIGHTS_GRAPH_DATA,
    aggregations,
    data: json
  };
}

function requestDocketTimeline() {
  return {
    type: REQUEST_DOCKET_TIMELINE
  };
}

function receiveDocketTimeline(params, json) {
  return {
    type: RECEIVE_DOCKET_TIMELINE,
    dockets: json.document_timelines
  };
}

function requestRecentActivity() {
  return {
    type: REQUEST_RECENT_ACTIVITY
  };
}

function receiveRecentActivity(response, agencies) {
  const agenciesArray = response.aggregations.filtered_documents['by_agencies.id'].buckets;
  const total_updates = response.aggregations.filtered_documents.doc_count;

  // put agencies into an object to reduce lookup time complexity
  const agenciesObj = agenciesArray.reduce((mem, agency) => {
    mem[agency.key] = {
      categories: agency.by_category.buckets
    };
    return mem;
  }, {});
  // filter by user's agencies and format data for reducer
  const document_stats = agencies.map(agency => {
    const myAgencyObj = {
      agency_id: agency,
      categories: {}
    };
    if (!_.isNil(agenciesObj[agency])) {
      const categories = agenciesObj[agency].categories.reduce((mem, category) => {
        mem[category.key] = category.doc_count;
        return mem;
      }, {});
      myAgencyObj.categories = categories;
    }

    return myAgencyObj;
  });

  return {
    type: RECEIVE_RECENT_ACTIVITY,
    document_stats,
    total_updates
  };
}

function requestMention(filter, id_or_name) {
  return {
    type: REQUEST_MENTION,
    filter,
    id_or_name
  };
}

function receiveMention(json) {
  return {
    type: RECEIVE_MENTION,
    mention: json
  };
}

function requestRelatedDocumentCount(params) {
  return {
    type: REQUEST_RELATED_DOCUMENT_COUNT,
    params
  };
}

function receiveRelatedDocumentCount(params, response) {
  return {
    type: RECEIVE_RELATED_DOCUMENT_COUNT,
    params,
    response
  };
}

function createDocument(params) {
  return {
    type: CREATE_DOCUMENT,
    params
  };
}

function createdDocument(json) {
  return {
    type: DOCUMENT_CREATED,
    document: json
  };
}

function createAnnotationTask(params) {
  return {
    type: CREATE_ANNOTATION_TASK,
    params
  };
}

function annotationTaskCreated(json) {
  return {
    type: ANNOTATION_TASK_CREATED,
    annotation_task: json
  };
}

function updateAnnotationTask() {
  return {
    type: UPDATE_ANNOTATION_TASK
  };
}

function annotationTaskUpdated(json) {
  return {
    type: ANNOTATION_TASK_UPDATED,
    annotation_task: json ? json.annotation_task : null
  };
}

function deleteAnnotationTask() {
  return {
    type: DELETE_ANNOTATION_TASK
  };
}

function annotationTaskDeleted(json) {
  return {
    type: ANNOTATION_TASK_DELETED,
    annotation_task: json
  };
}

function updatePublication() {
  return {
    type: UPDATE_PUBLICATION
  };
}

function publicationUpdated(json) {
  return {
    type: PUBLICATION_UPDATED,
    publication: json ? json.publication : null
  };
}

function requestHiddenDocuments() {
  return {
    type: REQUEST_HIDDEN_DOCUMENTS
  };
}

function receiveHiddenDocuments(json) {
  return {
    type: RECEIVE_HIDDEN_DOCUMENTS,
    hidden_documents: json
  };
}

function requestAnnotationJobs(task_id) {
  return {
    type: REQUEST_ANNOTATION_JOBS
  };
}

function receiveAnnotationJobs(json) {
  return {
    type: RECEIVE_ANNOTATION_JOBS,
    annotation_jobs: json
  };
}

function createAnnotations(task_id, job_id, params) {
  return {
    type: CREATE_ANNOTATIONS_FOR_JOB,
    task_id,
    job_id,
    params
  };
}

function annotationsCreated(json) {
  return {
    type: ANNOTATIONS_FOR_JOB_CREATED,
    annotations_for_job: json
  };
}

function requestAllTermSamplingGroups() {
  return {
    type: REQUEST_TERM_SAMPLING_GROUPS
  };
}

function receiveAllTermSamplingGroups(json) {
  return {
    type: RECEIVE_TERM_SAMPLING_GROUPS,
    term_sampling_groups: json
  };
}

function createTermSamplingGroup(params) {
  return {
    type: CREATE_TERM_SAMPLING_GROUP,
    params
  };
}

function termSamplingGroupCreated(json) {
  return {
    type: TERM_SAMPLING_GROUP_CREATED,
    term_sampling_group: json
  };
}

function updateTermSamplingGroup() {
  return {
    type: UPDATE_TERM_SAMPLING_GROUP
  };
}

function termSamplingGroupUpdated(json) {
  return {
    type: TERM_SAMPLING_GROUP_UPDATED,
    term_sampling_group: json ? json.term_sampling_group : null
  };
}

function requestAnnotationStatistics(task_id) {
  return {
    type: REQUEST_ANNOTATION_STATISTICS
  };
}

function receiveAnnotationStatistics(json) {
  return {
    type: RECEIVE_ANNOTATION_STATISTICS,
    statistics: json
  };
}

function requestAllAnnotationJobs(task_id) {
  return {
    type: REQUEST_ALL_ANNOTATION_JOBS
  };
}

function receiveAllAnnotationJobs(json) {
  return {
    type: RECEIVE_ALL_ANNOTATION_JOBS,
    all_annotation_jobs: json
  };
}

function requestInsightsCsv(slug) {
  return {
    type: REQUEST_INSIGHTS_CSV
  };
}

function receiveInsightsCsv(json) {
  return {
    type: RECEIVE_INSIGHTS_CSV,
    insights_csv: json
  };
}

function requestAnnotationJobById(task_id, job_id) {
  return {
    type: REQUEST_ANNOTATION_JOB_BY_ID
  };
}

function receiveAnnotationJobById(json) {
  return {
    type: RECEIVE_ANNOTATION_JOB_BY_ID,
    annotation_jobs: json
  };
}

function requestContributorStatistics(task_id) {
  return {
    type: REQUEST_CONTRIBUTOR_STATISTICS
  };
}

function receiveContributorStatistics(json) {
  return {
    type: RECEIVE_CONTRIBUTOR_STATISTICS,
    contributor_statistics: json
  };
}

function requestContributorReviewsCount(task_id) {
  return {
    type: REQUEST_CONTRIBUTOR_REVIEWS_COUNT
  };
}

function receiveContributorReviewsCount(json) {
  return {
    type: RECEIVE_CONTRIBUTOR_REVIEWS_COUNT,
    contributor_reviews_count: json
  };
}

function requestAllSkippedAnnotations() {
  return {
    type: REQUEST_All_SKIPPED_ANNOTATIONS
  };
}

function receiveAllSkippedAnnotations(json) {
  return {
    type: RECEIVE_All_SKIPPED_ANNOTATIONS,
    all_skipped_annotations: json.annotation_jobs
  };
}

function requestAllSubscriptions() {
  return {
    type: REQUEST_ALL_SUBSCRIPTIONS
  };
}

function receiveAllSubscriptions(json) {
  return {
    type: RECEIVE_ALL_SUBSCRIPTIONS,
    all_subscriptions: json.all_subscriptions
  };
}

function updateSubscription(id, params) {
  return {
    type: UPDATE_SUBSCRIPTION,
    id,
    params
  };
}

function subscriptionUpdated(json) {
  return {
    type: SUBSCRIPTION_UPDATED,
    subscription: json
  };
}

function requestAllPlans() {
  return {
    type: REQUEST_ALL_PLANS
  };
}

function receiveAllPlans(json) {
  return {
    type: RECEIVE_ALL_PLANS,
    plans: json.all_plans
  };
}

function requestAllTopics() {
  return {
    type: REQUEST_ALL_TOPICS
  };
}

function receiveAllTopics(json) {
  return {
    type: RECEIVE_ALL_TOPICS,
    all_topics: json
  };
}

function requestTopicsStats() {
  return {
    type: REQUEST_TOPICS_STATS
  };
}

function receiveTopicsStats(json) {
  return {
    type: RECEIVE_TOPICS_STATS,
    topics_stats: json
  };
}

function createTopic(params) {
  return {
    type: CREATE_TOPIC,
    params
  };
}

function topicCreated(json) {
  return {
    type: TOPIC_CREATED,
    topic: json
  };
}

function updateTopic() {
  return {
    type: UPDATE_TOPIC
  };
}

function topicUpdated(json) {
  return {
    type: TOPIC_UPDATED,
    topic: json ? json.topic : null
  };
}

// add 401/403 errors as auth errors, otherwise use the component
// this allows the frontend to easily handle expired tokens and such
function checkAndAddError(dispatch, error, component) {
  const metadata = {
    component: {
      name: component
    }
  };

  if (_.hasIn(error, 'status')) {
    if (error.status === 401 || error.status === 403) {
      dispatch(addError(error, 'auth'));
    } else if (!error.status) {
      // usually a timeout error (status=0), don't report this
      dispatch(addError(error, component));
      safe_ga('send', 'exception', {
        exDescription: 'XHR timeout',
        exFatal: true
      });
      safe_mixpanel_track('Exception – XHR timeout', {
        hitType: 'exception',
        exDescription: 'XHR timeout',
        exFatal: true
      });
    } else {
      metadata.xhr = {
        status: error.status,
        statusText: error.statusText,
        url: error._url
      };
      Bugsnag.notifyException(error, 'XMLHttpRequestError', metadata);

      safe_ga('send', 'exception', {
        exDescription: 'XHR error',
        exFatal: true
      });
      safe_mixpanel_track('Exception – XHR error', {
        hitType: 'exception',
        exDescription: 'XHR error',
        exFatal: true
      });
      dispatch(addError(error, component));
    }
  } else {
    dispatch(addError(error, component));
    Bugsnag.notifyException(error, null, metadata);

    safe_ga('send', 'exception', {
      exDescription: error.message,
      exFatal: true
    });
    safe_mixpanel_track('Exception – Other', {
      hitType: 'exception',
      exDescription: error.message,
      exFatal: true
    });
  }
}

function buildUrlFromParams(params = {}) {
  params = {
    ...params
  };

  let url = apiUrl + '/documents';

  if (!_.isNil(params.id)) {
    url += '/' + params.id;
  }

  url += '?';

  if (params.folder_id) {
    url += `folder_id=${params.folder_id}`;
    url += `&all_agencies=true`;
    url += `&all_topics=true`;
  }

  if (params.offset) {
    url += `&offset=${params.offset}`;
  }

  if (params.limit) {
    url += `&limit=${params.limit}`;
  } else if (params.folder_id) {
    url += `&limit=1000`; //FIXME: tmp high limit in folder view, add pagination later
  } else {
    url += `&limit=20`;
  }

  if (!_.isNil(params.agency) && params.agency.length > 0) {
    if (typeof params.agency === 'string') {
      url += `&agency_id=${params.agency}`;
    } else {
      for (const agency of params.agency) {
        url += `&agency_id=${agency}`;
      }
    }
  }

  if (!_.isNil(params.skip_agency) && params.skip_agency.length > 0) {
    if (typeof params.skip_agency === 'string') {
      url += `&skip_agency=${params.skip_agency}`;
    } else {
      for (const agency of params.skip_agency) {
        url += `&skip_agency=${agency}`;
      }
    }
  }

  if (!_.isNil(params.skip_category) && params.skip_category.length > 0) {
    if (typeof params.skip_category === 'string') {
      url += `&skip_category=${params.skip_category}`;
    } else {
      for (const category of params.skip_category) {
        url += `&skip_category=${category}`;
      }
    }
  }

  // n.b. need to encodeURIComponent because this came from a file rather than over the wire
  if (!_.isNil(params.category) && params.category.length > 0) {
    if (typeof params.category === 'string') {
      params.category = [params.category];
    }
    for (const category of params.category) {
      // n.b. hack so that the combined Agency Update document types that the users sees
      // will get filtered the same way the display re-maps them (including Agency News types)
      if (category === 'Agency Update') {
        url += `&category=${encodeURIComponent('Agency News')}`;
        url += `&category=${encodeURIComponent('Updates')}`;
        url += `&category=${encodeURIComponent('SRO Update')}`;
        url += `&category=${encodeURIComponent('Agency Update')}`;
        url += `&category=${encodeURIComponent('Guidance')}`;
        url += `&category=${encodeURIComponent('Public Statement')}`;
      } else if (category === 'Rule') {
        url += `&category=${encodeURIComponent('Final Rule')}`;
        url += `&category=${encodeURIComponent('Rule')}`;
      } else if (category === 'Enforcement') {
        url += `&category=${encodeURIComponent('Enforcement')}`;
        url += `&category=${encodeURIComponent('Enforcement Action')}`;
        url += `&category=${encodeURIComponent('Enforcement Document')}`;
      } else {
        url += `&category=${encodeURIComponent(category_to_api(category))}`;
      }
    }
  }

  if (!_.isNil(params.read) && params.read.length > 0) {
    url += `&read=${params.read}`;
    //read folder/read filter view only
    if (params.read_folder_view) {
      // n.b. the api default behavior for filtering limits the list of agencies
      // we need to peel off this restriction here
      url += `&all_agencies=true`;
      url += `&all_topics=true`;
    }
  }

  if (!_.isNil(params.bookmarked) && params.bookmarked.length > 0) {
    url += `&bookmarked=${params.bookmarked}`;
    // n.b. the api default behavior for filtering limits the list of agencies
    // we need to peel off this restriction here
    url += `&all_agencies=true`;
    url += `&all_topics=true`;
  }

  if (!_.isNil(params.published_to) && params.published_to.length > 0) {
    url += `&published_to=${params.published_to}`;
  }

  if (!_.isNil(params.published_from) && params.published_from.length > 0) {
    url += `&published_from=${params.published_from}`;
  }

  if (!_.isNil(params.compliance_to) && params.compliance_to.length > 0) {
    url += `&compliance_to=${params.compliance_to}`;
  }

  if (!_.isNil(params.compliance_from) && params.compliance_from.length > 0) {
    url += `&compliance_from=${params.compliance_from}`;
  }

  if (!_.isNil(params.comments_close_to) && params.comments_close_to.length > 0) {
    url += `&comments_close_to=${params.comments_close_to}`;
  }

  if (!_.isNil(params.comments_close_from) && params.comments_close_from.length > 0) {
    url += `&comments_close_from=${params.comments_close_from}`;
  }

  if (!_.isNil(params.key_date_to) && params.key_date_to.length > 0) {
    url += `&key_date_to=${params.key_date_to}`;
  }

  if (!_.isNil(params.key_date_from) && params.key_date_from.length > 0) {
    url += `&key_date_from=${params.key_date_from}`;
  }

  if (!_.isNil(params.sort) && params.sort.length > 0) {
    url += `&sort=${params.sort}`;
  }

  if (!_.isNil(params.order) && params.order.length > 0) {
    url += `&order=${params.order}`;
  }

  if (!_.isNil(params.search_sort) && params.search_sort === 'relevance') {
    if (params.search_query) {
      url += `&query=${params.search_query}`;
    }

    // n.b. the api default behavior for filtering limits the list of agencies
    // we need to peel off this restriction here
    url += `&all_agencies=true`;
    url += `&all_topics=true`;
  }

  if (!_.isNil(params.topic_id) && params.topic_id.length > 0) {
    if (typeof params.topic_id === 'string') {
      url += `&topic_id=${params.topic_id}`;
    } else {
      for (const id of params.topic_id) {
        url += `&topic_id=${id}`;
      }
    }
  }
  
  if (!_.isNil(params.search_sort) && params.search_sort === 'date') {
    // n.b. the api default behavior for filtering limits the list of agencies
    // we need to peel off this restriction here
    url += `&all_agencies=true`;
    url += `&all_topics=true`;

    // we need the full text in order to do client-side highlighting
    // n.b. this will definitely slow us down.. is there another way?
    url += `&full_text=true`;

    // ensure we get the most recent documents first
    url += `&sort=publication_date&order=desc`;

    // ensure we return mentions that triggered the proposed filter match
    // so we can highlight those terms
    url += `&include_mentions_for_filter=true`;

    // only use autosuggest filters when we are in date/filter mode
    // n.b. agencies is handled separately, and leads to somewhat of a
    // doubling up effect, but i think that is probably OK
    if (!_.isNil(params.regulation_id)) {
      url += `&regulation_id=${params.regulation_id}`;
    }

    if (!_.isNil(params.act_id)) {
      url += `&act_id=${params.act_id}`;
    }

    if (!_.isNil(params.docket_id)) {
      url += `&docket_id=${params.docket_id}`;
    }

    if (!_.isNil(params.concept_id)) {
      url += `&concept_id=${params.concept_id}`;
    }

    if (!_.isNil(params.citation_id)) {
      url += `&citation_id=${params.citation_id}`;
    }

    if (!_.isNil(params.bank_id)) {
      url += `&bank_id=${params.bank_id}`;
    }

    for (const category of categories_skipped_in_date_search) {
      url += `&skip_category=${category}`;
    }
  }

  if (!_.isNil(params.more_like_doc_id)) {
    url += `&more_like_doc_id=${params.more_like_doc_id}`;
  }

  if (!_.isNil(params.all_agencies)) {
    url += `&all_agencies=${params.all_agencies}`;
  }

  if (!_.isNil(params.all_topics)) {
    url += `&all_topics=${params.all_topics}`;
  }

  if (!_.isNil(params.decorate_children)) {
    url += `&decorate_children=${params.decorate_children}`;
  }

  if (!_.isNil(params.state_code)) {
    url += `&skip_fields_for_state_code=${params.state_code}`;
  }

  if (!_.isNil(params.doc_details)) {
    url += `&skip_fields_for_right_panel=${params.doc_details}`;
  }

  // make skipping unused fields the default behavior, unless overriden
  if (_.isNil(params.skip_unused_fields)) {
    params.skip_unused_fields = true;
  }

  // Adding option to skip a set of fields, termed unused fields, the idea being that these fields
  // are not used by the front-end application currently, so we provide a boolean flag to toggle
  // them all off in one go to reduce the size of the payload
  if (params.skip_unused_fields) {
    url += '&skip_unused_fields=true';
  }

  if (!_.isNil(params.get_count_only)) {
    url += `&get_count_only=${params.get_count_only}`;
  }

  if (params.jurisdiction) {
    url += `&jurisdiction=${params.jurisdiction}`;
  }

  return url;
}

function updateUserPoints() {
  return {
    type: UPDATE_USER_POINTS
  };
}

function userPointsUpdated() {
  return {
    type: USER_POINTS_UPDATED
  };
}
//list of short_names to use avaliable in api.
// this action creator is called by other action creators
export function addContributorPoints(short_name) {
  const url = apiUrl + '/contributor_points';
  return function dopost(dispatch) {
    dispatch(updateUserPoints());
    request({
      url,
      data: JSON.stringify({ short_name }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(userPointsUpdated());
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'contributor_points_add');
      });
  };
}

function makeDocumentRequests(common_params, extra_param_list) {
  const urls = [];

  for (const extra_params of extra_param_list) {
    const cur_params = _.assign({}, common_params, extra_params);
    urls.push(buildUrlFromParams(cur_params));
  }
  const promises = [];
  for (const url of urls) {
    promises.push(
      request({
        url,
        method: 'GET',
        crossOrigin: true,
        type: 'json',
        headers: {
          Authorization: localStorage.token
        }
      })
    );
  }

  return promises;
}

export function fetchSearchResults(params = {}) {
  let request_type;
  let receive_type;
  if (params.search_sort === 'date') {
    request_type = REQUEST_SEARCH_RESULTS_FILTER;
    receive_type = RECEIVE_SEARCH_RESULTS_FILTER;
  } else {
    request_type = REQUEST_SEARCH_RESULTS_RELEVANCE;
    receive_type = RECEIVE_SEARCH_RESULTS_RELEVANCE;
  }
  return function dofetch(dispatch) {
    dispatch(requestSearchResults(params, request_type));

    const url = buildUrlFromParams(params);
    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveSearchResults(response, receive_type));
      })
      .catch((...args) => {
        for (const error of args) {
          checkAndAddError(dispatch, error, 'documents');
        }
      });
  };
}

export function fetchDocuments(params = {}, extra_params) {
  let request_type;
  let receive_type;
  //necessary for dual timeline view of folder docs and reg timeline docs
  if (params.folder_id && !params.folderTimelineView) {
    request_type = REQUEST_FOLDER_DOCUMENTS;
    receive_type = RECEIVE_FOLDER_DOCUMENTS;
  } else {
    request_type = REQUEST_DOCUMENTS;
    receive_type = RECEIVE_DOCUMENTS;
  }

  const common_params = _.assign({}, params, extra_params);
  const today_date_moment = moment().format('MM/DD/YYYY');
  let per_request_params = [
    { sort: 'publication_date' },
    { sort: 'rule.effective_on', order: 'asc', compliance_from: today_date_moment },
    { sort: 'rule.comments_close_on', order: 'asc', comments_close_from: today_date_moment }
  ];
  //only make one request for folder documents
  if (params.folder_id) {
    per_request_params = [{ sort: 'publication_date' }];
  }
  return function dofetch(dispatch) {
    dispatch(requestDocuments(common_params, per_request_params, request_type));
    return Promise.all(makeDocumentRequests(common_params, per_request_params))
      .then(responses => {
        dispatch(receiveDocuments(common_params, per_request_params, responses, receive_type));
        return responses;
      })
      .catch((...args) => {
        for (const error of args) {
          checkAndAddError(dispatch, error, 'documents');
        }
      });
  };
}

function requestSimpleDocuments() {
  return {
    type: REQUEST_SIMPLE_DOCUMENTS
  };
}

function receiveSimpleDocuments(data) {
  return {
    type: RECEIVE_SIMPLE_DOCUMENTS,
    recent_documents: data.documents
  };
}

export function setDocsToSelect(docs) {
  return {
    type: SET_DOCS_TO_SELECT,
    docs_to_select: docs
  };
}

export function simpleFetchDocuments(params = {}) {
  requestSimpleDocuments();
  return function doFetch(dispatch) {
    const url = buildUrlFromParams(params);
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveSimpleDocuments(response));
        return response;
      })
      .catch((...args) => {
        for (const error of args) {
          dispatch(checkAndAddError(dispatch, error, 'documents'));
        }
      });
  };
}

export function fetchDocumentsAfter(params = {}, extra_params) {
  const common_params = _.assign({}, params, extra_params);

  return function dofetch(dispatch) {
    dispatch(requestDocumentsAfter(common_params, extra_params));

    return Promise.all(makeDocumentRequests(common_params, extra_params))
      .then(responses => {
        dispatch(receiveDocumentsAfter(common_params, extra_params, responses));
      })
      .catch((...args) => {
        for (const error of args) {
          checkAndAddError(dispatch, error, 'documents');
        }
      });
  };
}

export function fetchDocumentsBefore(params = {}, extra_params) {
  const common_params = _.assign({}, params, extra_params);

  return function dofetch(dispatch) {
    dispatch(requestDocumentsBefore(common_params, extra_params));

    return Promise.all(makeDocumentRequests(common_params, extra_params))
      .then(responses => {
        dispatch(receiveDocumentsBefore(common_params, extra_params, responses));
      })
      .catch((...args) => {
        for (const error of args) {
          checkAndAddError(dispatch, error, 'documents');
        }
      });
  };
}

export function fetchFullDocuments(params = {}, no_ready_update = false) {
  const ids = _.isArray(params.id) ? params.id : [params.id];
  const common_params = { ...params };
  delete common_params.id;

  const urls = [];

  for (const id of ids) {
    const cur_params = _.assign({}, common_params, { id });
    urls.push(buildUrlFromParams(cur_params));
  }

  return function dofetch(dispatch) {
    if (params.state_code) {
      dispatch(requestStateCode());
    } else if (params.doc_details) {
      dispatch(requestDocumentDetails());
    } else if (!params.state_code && !no_ready_update) {
      dispatch(requestFullDocuments(params, ids));
    }

    const promises = [];
    for (const url of urls) {
      promises.push(
        request({
          url,
          method: 'GET',
          crossOrigin: true,
          type: 'json',
          headers: {
            Authorization: localStorage.token
          }
        })
      );
    }

    return Promise.all(promises)
      .then(responses => {
        if (params.state_code) {
          dispatch(receiveStateCode(responses));
        } else if (params.doc_details) {
          dispatch(recieveDocumentDetails(responses));
        } else {
          dispatch(receiveFullDocuments(common_params, responses, no_ready_update));
        }
        return responses;
      })
      .catch((...args) => {
        for (const error of args) {
          if (params.state_code) {
            checkAndAddError(dispatch, error, 'state_code');
          } else if (params.doc_details) {
            checkAndAddError(dispatch, error, 'document_details');
          } else {
            checkAndAddError(dispatch, error, 'document_summary');
          }
        }
      });
  };
}

function fetchFromStore() {
  return {
    type: FETCH_FROM_STORE
  };
}

/*
  Foe action to trigger componentWillRecieveProps
  in the stateCode.js component without making a
  AJAX request to the api
*/
export function fetchDataFromStore() {
  return function dofetch(dispatch) {
    const promises = [dispatch(fetchFromStore())];
    return Promise.all(promises);
  };
}

export function clearStateCode() {
  return {
    type: CLEAR_STATE_CODE
  };
}

export function fetchCurrentUser() {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/current_user';

  return function dofetch(dispatch) {
    dispatch(requestCurrentUser());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveCurrentUser(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'user');
      });
  };
}

export function fetchSpecifiedUser(email) {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/users/' + email;

  return function dofetch(dispatch) {
    dispatch(requestSpecifiedUser(email));

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveSpecifiedUser(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'user');
      });
  };
}

export function fetchAllUsers() {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/users';

  return function dofetch(dispatch) {
    dispatch(requestAllUsers());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllUsers(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'users');
      });
  };
}

function deletingUser() {
  return {
    type: DELETE_USER
  };
}

function userDeleted() {
  return {
    type: USER_DELETED
  };
}

export function deleteUser(email) {
  const url = apiUrl + '/delete_user/' + email;

  return function doDelete(dispatch) {
    dispatch(deletingUser());

    return request({
      url,
      method: 'DELETE',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(res => {
        dispatch(userDeleted());
        return res;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'delete_user');
      });
  };
}

export function fetchAllAnnotationTasks(data) {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/annotation_tasks';

  return function dofetch(dispatch) {
    dispatch(requestAllAnnotationTasks());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      data,
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllAnnotationTasks(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'users');
      });
  };
}

export function fetchAllPublications() {
  // dispatch provided by magic middleware redux-thunk
  const url = dataApiUrl + '/publications';

  return function dofetch(dispatch) {
    dispatch(requestAllPublications());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllPublications(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'users');
      });
  };
}

export function fetchStatistics(data) {
  const url = apiUrl + '/rules_created_by_time';
  return function dofetch(dispatch) {
    dispatch(requestStatistics());
    return request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveStatistics(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'statistics');
      });
  };
}

export function fetchAllCategories() {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/categories';

  return function dofetch(dispatch) {
    dispatch(requestAllCategories());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllCategories(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'categories');
      });
  };
}

export function fetchAllSpiderNames() {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/spider_names';

  return function dofetch(dispatch) {
    dispatch(requestAllSpiderNames());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllSpiderNames(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'spider_names');
      });
  };
}

export function fetchAllProvenances() {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/provenances';

  return function dofetch(dispatch) {
    dispatch(requestAllProvenances());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllProvenances(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'provenances');
      });
  };
}

export function fetchAllJurisdictions() {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/jurisdictions';

  return function dofetch(dispatch) {
    dispatch(requestAllJurisdictions());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllJurisdictions(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'jurisdictions');
      });
  };
}

//seperate documents method for admin document editing interface
export function fetchAllDocuments(params) {
  let url = apiUrl + '/documents';
  let isFirstParm = true;
  Object.keys(params).forEach(key => {
    if (params[key]) {
      if (isFirstParm) {
        url += '?';
      } else {
        url += '&';
      }
      if (key === 'agency_id' && typeof params.agency_id !== 'string') {
        for (const agency of params.agency_id) {
          url += '&' + 'agency_id=' + agency;
        }
      } else if (key === 'topic_id' && typeof params.topic_id !== 'string') {
        for (const topic of params.topic_id) {
          url += '&' + 'topic_id=' + topic;
        }
      } else {
        url += key + '=' + params[key];
      }
      isFirstParm = false;
    }
  });

  return function dofetch(dispatch) {
    dispatch(requestAllDocuments());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllDocuments(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'alldocuments');
      });
  };
}

export function fetchIncompleteDocs(params) {
  let url = dataApiUrl + '/incomplete_docs';

  const legit_params = _.filter(Object.keys(params), k => {
    return Number.isInteger(params[k]) || (typeof params[k] === 'string' && params[k].length > 0);
  });
  const url_suffix = _.map(legit_params, k => {
    return k + '=' + encodeURIComponent(params[k].toString());
  }).join('&');

  if (url_suffix.length > 0) {
    url += '?' + url_suffix;
  }

  return function dofetch(dispatch) {
    dispatch(requestIncompleteDocuments());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveIncompleteDocuments(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'incomplete_documents');
      });
  };
}

export function markDocumentAsRead(doc_ids, read_or_unread) {
  const url = apiUrl + '/documents';
  let document_ids = doc_ids;

  if (!_.isArray(doc_ids)) {
    document_ids = [doc_ids];
  }

  return function dopost(dispatch) {
    dispatch(markDocumentRead(document_ids, read_or_unread));

    request({
      url,
      data: JSON.stringify({ document_ids, read: read_or_unread }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(markedDocumentAsRead(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'document');
        dispatch(markedDocumentAsRead(null));
      });
  };
}

export function markDocumentAsBookmarked(doc_ids, bookmarked_status) {
  const url = apiUrl + '/documents';

  let document_ids = doc_ids;

  if (!_.isArray(doc_ids)) {
    document_ids = [doc_ids];
  }

  return function dopost(dispatch) {
    dispatch(markDocumentBookmarked(document_ids, bookmarked_status));
    request({
      url,
      data: JSON.stringify({ document_ids, bookmarked: bookmarked_status }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(addContributorPoints('bookmarkdoc'));
        dispatch(markedDocumentAsBookmarked(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'document');
        dispatch(markedDocumentAsBookmarked(null));
      });
  };
}

export function flagDocument(doc_id, params) {
  const url = apiUrl + '/documents/' + doc_id;

  return function dopost(dispatch) {
    dispatch(markDocumentAsFlagged(doc_id, params));

    return request({
      url,
      data: JSON.stringify({ flagged: params }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(markedDocumentAsFlagged(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'document');
        dispatch(markedDocumentAsFlagged(null));
      });
  };
}

export function updateDocument(doc_id, params) {
  const url = apiUrl + '/documents/' + doc_id;

  return function dopost(dispatch) {
    dispatch(updateDocumentData(doc_id, params));

    return request({
      url,
      data: JSON.stringify({ update: params }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(documentDataUpdated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'document');
        dispatch(documentDataUpdated(null));
      });
  };
}

function updateDocumentTag(doc_id, tag_id, tag_status, tag_name) {
  return {
    type: UPDATE_DOCUMENT_TAG,
    doc_id,
    tag_id,
    tag_status,
    tag_name
  };
}

function updatedDocumentTag(doc_id, tag_id, tag_status, tag_name, response) {
  return {
    type: UPDATED_DOCUMENT_TAG,
    doc_id,
    tag_id,
    tag_status,
    tag_name
  };
}

export function tagDocument(doc_id, tag_id, tag_status, tag_name) {
  tag_id = parseInt(tag_id, 10);
  // XXX get tag name for optimistic update?
  const url = apiUrl + '/documents/' + doc_id;
  const args = {
    tag: {
      id: tag_id,
      is_positive: tag_status,
      display_style: 'modal'
    }
  };

  return function dopost(dispatch) {
    dispatch(updateDocumentTag(doc_id, tag_id, tag_status, tag_name));

    request({
      url,
      data: JSON.stringify(args),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(updatedDocumentTag(doc_id, tag_id, tag_status, tag_name, response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'document');
        // XXX roll back failed tag update?
      });
  };
}

function createNewTag(tag_name) {
  return {
    type: CREATE_NEW_TAG,
    tag_name
  };
}

function createdNewTag(tag_name, response) {
  return {
    type: CREATED_NEW_TAG,
    tag_name
  };
}

export function createTag(tag_name) {
  const url = apiUrl + '/tags';
  const args = {
    name: tag_name
  };

  return function dopost(dispatch) {
    dispatch(createNewTag(tag_name));

    // allow chaining the promise
    return request({
      url,
      data: JSON.stringify(args),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(createdNewTag(tag_name, response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'document');
        // XXX roll back failed tag update?
      });
  };
}

export function fetchFolders() {
  const url = apiUrl + '/folders';

  return function dofetch(dispatch) {
    dispatch(requestFolders());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveFolders(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folders');
      });
  };
}

export function addUserFolder(name) {
  const url = apiUrl + '/folders?' + `&name=${name}`;

  return function dopost(dispatch) {
    dispatch(addNewFolder());

    //allow chaining of promise
    return request({
      url,
      method: 'POST',
      data: JSON.stringify({ name }),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(newFolderAdded(response));
        dispatch(addContributorPoints('createfolder'));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folder_share');
      });
  };
}

function renameFolder() {
  return {
    type: UPDATE_FOLDER_NAME
  };
}

function folderRenamed() {
  return {
    type: FOLDER_NAME_UPDATED
  };
}

export function renameUserFolder(name, folder_id) {
  const url = apiUrl + '/folders/' + folder_id;

  return function dopost(dispatch) {
    dispatch(renameFolder());

    return request({
      url,
      method: 'POST',
      data: JSON.stringify({ name }),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(folderRenamed());
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folders');
      });
  };
}

function deletingUserFolder() {
  return {
    type: DELETE_USER_FOLDER
  };
}

function folderDeleted() {
  return {
    type: USER_FOLDER_DELETED
  };
}

export function removeUserFolder(folder_id) {
  const url = apiUrl + '/folders/' + folder_id;

  return function doDelete(dispatch) {
    dispatch(deletingUserFolder());

    return request({
      url,
      method: 'DELETE',
      data: JSON.stringify({ folder_id }),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(() => {
        dispatch(folderDeleted());
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folders');
      });
  };
}

export function addDocumentsToFolder(document_ids, folder_id) {
  return function dopost(dispatch) {
    dispatch(addingDocumentsToFolder());
    const url = apiUrl + '/documents';

    return request({
      url,
      method: 'POST',
      data: JSON.stringify({ document_ids, folder_id }),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(() => {
        dispatch(documentsAddedToFolder());
        dispatch(addContributorPoints('addtofolder'));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folders');
      });
  };
}

function deletingDocumentsFromFolder() {
  return {
    type: DELETE_DOCUMENTS_FROM_FOLDERS
  };
}

function documentsDeletedFromFolder() {
  return {
    type: DOCUMENTS_DELETED_FROM_FOLDERS
  };
}

export function removeDocumentsFromFolder(document_ids, folder_id) {
  const url = apiUrl + '/folders/' + folder_id;
  return function doDelete(dispatch) {
    dispatch(deletingDocumentsFromFolder());

    return request({
      url,
      method: 'DELETE',
      data: JSON.stringify({ document_ids }),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(() => {
        dispatch(documentsDeletedFromFolder());
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folders');
      });
  };
}

export function saveUnBookmarkedDocument(id) {
  return {
    type: SAVE_UNBOOKMARKED_DOCUMENT,
    id
  };
}

export function followAgencies(agencies) {
  const url = apiUrl + '/agencies';

  return function dopost(dispatch) {
    dispatch(followAgenciesBegin(agencies));

    return request({
      url,
      data: JSON.stringify(agencies),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(followedAgencies(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'sources');
      });
  };
}

export function updateCurrentUser(original_email, data) {
  const url = apiUrl + '/users/' + encodeURIComponent(original_email);

  return function dopost(dispatch) {
    dispatch(modifyCurrentUser());

    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        return dispatch(modifiedCurrentUser(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'settings');
        dispatch(modifiedCurrentUser(null));
      });
  };
}

export function updateSpecifiedUser(original_email, data) {
  const url = apiUrl + '/users/' + encodeURIComponent(original_email);
  return function dopost(dispatch) {
    dispatch(modifySpecifiedUser());

    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(modifiedSpecifiedUser(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'settings');
        dispatch(modifiedSpecifiedUser(null));
      });
  };
}

function requestSearchFilterAgencies() {
  return {
    type: REQUEST_SEARCH_FILTER_AGENCIES
  };
}

function receiveSearchFilterAgencies(json) {
  return {
    type: RECIEVE_SEARCH_FILTER_AGENCIES,
    agencies: json.agencies
  };
}

export function fetchAgencies(following, search_filter = false) {
  let url = apiUrl + '/agencies';

  if (following) {
    url = url + '?following=' + following;
  }

  if (search_filter) {
    url = url + '?search_filter=' + search_filter;
  }

  return function dofetch(dispatch) {
    if (search_filter) {
      dispatch(requestSearchFilterAgencies(search_filter));
    } else {
      dispatch(requestAgencies(following));
    }

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        if (search_filter) {
          dispatch(receiveSearchFilterAgencies(response));
        } else {
          dispatch(receiveAgencies(response, following));
        }
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'agencies');
      });
  };
}

export function fetchFollowedEntities(data) {
  const url = apiUrl + '/followed_entities';
  return function dofetch(dispatch) {
    dispatch(requestFollowedEntities());

    return request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recieveFollowedEntities(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'followed_entities');
      });
  };
}

function markingEntitiesFollowed() {
  return {
    type: FOLLOWING_ENTITIES
  };
}

function markedEntitiesFollowed() {
  return {
    type: ENTITIES_FOLLOWED
  };
}

export function followEntities(entities_data) {
  const url = apiUrl + '/followed_entities';

  return function doPost(dispatch) {
    dispatch(markingEntitiesFollowed());

    return request({
      url,
      data: JSON.stringify(entities_data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(markedEntitiesFollowed());
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'states');
      });
  };
}

export function fetchTags(params) {
  const url = apiUrl + '/tags';

  return function dofetch(dispatch) {
    dispatch(requestTags());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveTags(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'documents');
      });
  };
}

export function fetchInsightsGraphData() {
  const aggregations = ['act_enforcement_matrix', 'rules_by_quarter', 'rules_by_agency'];
  const urls = [];

  const args = aggregations.map(agg => {
    return querystring.encode(INSIGHTS_PARAMS[agg]);
  });

  aggregations.forEach((agg, i) => {
    urls.push(`${apiUrl}/${agg}?${args[i]}`);
  });

  return function dofetch(dispatch) {
    dispatch(requestInsightsGraphData());
    const graphDataRequests = [];

    for (const url of urls) {
      graphDataRequests.push(
        request({
          url,
          method: 'GET',
          crossOrigin: true,
          type: 'json',
          headers: {
            Authorization: localStorage.token
          }
        })
      );
    }

    Promise.all(graphDataRequests)
      .then(response => {
        dispatch(receiveInsightsGraphData(aggregations, response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'insights');
      });
  };
}

export function fetchDocketTimeline(params = {}) {
  const url = apiUrl + '/docket_timeline/' + params.document_id;

  return function dofetch(dispatch) {
    dispatch(requestDocketTimeline(params));

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveDocketTimeline(params, response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'document_summary');
      });
  };
}

export function fetchRecentActivity(daysSinceLastLogin, agencies) {
  // note: the user's the server determines which agencies the user is following
  // and returns recent activity for only those agencies
  const url = apiUrl + '/rules_created_by_time';
  return function dofetch(dispatch) {
    dispatch(requestRecentActivity());
    const data = {
      date_range_field: 'publication_date',
      from_date: daysSinceLastLogin + 'd',
      terms: ['agencies.id', 'category'], // order is important!
      followed_agencies: true
    };
    return request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveRecentActivity(response, agencies));
        return receiveRecentActivity(response, agencies);
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'statistics');
      });
  };
}

export function fetchAutoComplete(partialValue) {
  const url = apiUrl + '/autosuggest/' + encodeURIComponent(partialValue);

  return function dofetch(dispatch) {
    dispatch(requestAutoComplete());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAutoComplete(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'autocomplete');
      });
  };
}

export function fetchMention(type, id_or_name) {
  return function dofetch(dispatch) {
    dispatch(requestMention(type, id_or_name));
    if (_.isArray(id_or_name)) {
      const urls = [];
      for (const id of id_or_name) {
        urls.push(apiUrl + '/entities/' + type + '/' + id);
      }

      const promises = [];
      for (const url of urls) {
        promises.push(
          request({
            url,
            method: 'GET',
            crossOrigin: true,
            type: 'json',
            contentType: 'application/json',
            headers: {
              Authorization: localStorage.token
            }
          })
        );
      }

      return Promise.all(promises)
        .then(response => {
          dispatch(receiveMention(response));
        })
        .catch(error => {
          checkAndAddError(dispatch, error, 'user');
        });
    }
    const url = apiUrl + '/entities/' + type + '/' + id_or_name;
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveMention(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'user');
      });
  };
}

export function fetchRelatedDocumentCount(params = {}) {
  return function dofetch(dispatch) {
    dispatch(requestRelatedDocumentCount(params));

    const api_params = {
      ...params,
      search_sort: 'relevance',
      get_count_only: true
    };

    const url = buildUrlFromParams(api_params);

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveRelatedDocumentCount(params, response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'document_summary');
      });
  };
}

// Get google analytics reports for admin
export function fetchGoogleAnalyticsReports(eventaActions) {
  return function dofetch(dispatch) {
    dispatch(requestGoogleAnalyticsReports());

    const urls = [];

    for (const eventAction of eventaActions) {
      urls.push(gaApiUrl + '/google_analytics_top_documents?event_action=' + eventAction);
    }

    const promises = [];

    for (const url of urls) {
      promises.push(
        request({
          url,
          method: 'GET',
          crossOrigin: true,
          type: 'json',
          contentType: 'application/json',
          headers: {
            Authorization: localStorage.token
          }
        })
      );
    }
    return Promise.all(promises)
      .then(response => {
        dispatch(receiveGoogleAnalyticsReports(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'google_analytics_reports');
      });
  };
}

export function fetchUserCreatedDocuments(params) {
  let url = apiUrl + '/user_created_documents';
  if (params.status) {
    url += '?status=' + params.status;
  }

  return function dofetch(dispatch) {
    dispatch(requestUserCreatedDocuments());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveUserCreatedDocuments(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'UserCreatedDocuments');
      });
  };
}

export function creteDocumentFromUrl(params) {
  const url = apiUrl + '/user_created_documents';

  return function dopost(dispatch) {
    dispatch(createDocument(params));

    return request({
      url,
      data: JSON.stringify(params),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(createdDocument(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'user_created_document');
        dispatch(createdDocument(null));
      });
  };
}

export function createAnnotationTaskFromParams(params) {
  const url = apiUrl + '/annotation_tasks';

  return function dopost(dispatch) {
    dispatch(createAnnotationTask(params));

    return request({
      url,
      data: JSON.stringify(params),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(annotationTaskCreated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'annotation_task');
        dispatch(annotationTaskCreated(null));
      });
  };
}

export function updateAnnotationTaskWithParams(annotation_task_id, data) {
  const url = apiUrl + '/annotation_tasks/' + annotation_task_id;

  return function dopost(dispatch) {
    dispatch(updateAnnotationTask());

    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(annotationTaskUpdated(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'settings');
        dispatch(annotationTaskUpdated(null));
      });
  };
}

export function deleteAnnotationTaskWithParams(annotation_task_id, data) {
  const url = apiUrl + '/annotation_tasks/' + annotation_task_id;

  return function doDelete(dispatch) {
    dispatch(deleteAnnotationTask());

    return request({
      url,
      data: JSON.stringify(data),
      method: 'DELETE',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(annotationTaskDeleted(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'settings');
        dispatch(annotationTaskDeleted(JSON.parse(error.response)));
      });
  };
}

export function updatePublicationWithParams(publication_id, data) {
  const url = dataApiUrl + '/publications/' + publication_id;

  return function dopost(dispatch) {
    dispatch(updatePublication());

    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(publicationUpdated(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'settings');
        dispatch(publicationUpdated(null));
      });
  };
}

export function getResponseHeaders(data) {
  const url = apiUrl + '/new_document_url';

  return function dofetch(dispatch) {
    dispatch(requestNewDocumentUrlHeaders());

    return request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveNewDocumentUrlHeaders(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'user_created_document_url');
      });
  };
}

function requestMarketingCampaigns() {
  return {
    type: REQUEST_MARKETING_CAMPAIGNS
  };
}

function recieveMarketingCampaigns(data) {
  return {
    type: RECIEVE_MARKETING_CAMPAIGNS,
    campaigns: data.marketing_campaigns
  };
}

export function fetchMarketingCampaigns() {
  const url = apiUrl + '/marketing_campaigns';

  return function dofetch(dispatch) {
    dispatch(requestMarketingCampaigns());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recieveMarketingCampaigns(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'marketing_campaigns');
      });
  };
}

function createMarketingCampaign() {
  return {
    type: CREATE_MARKETING_CAMPAIGN
  };
}

function marketingCampaignCreated() {
  return {
    type: CREATED_MARKETING_CAMPAIGN
  };
}

export function createCampaign(params) {
  const url = apiUrl + '/marketing_campaigns';

  return function dopost(dispatch) {
    dispatch(createMarketingCampaign());

    return request({
      url,
      data: JSON.stringify(params),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(marketingCampaignCreated());
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'marketing_campaigns');
      });
  };
}

function updateMarketingCampaign() {
  return {
    type: UPDATE_MARKETING_CAMPAIGN
  };
}

function marketingCampaignUpdated() {
  return {
    type: UPDATED_MARKETING_CAMPAIGN
  };
}

export function updateCampaign(id, params) {
  const url = apiUrl + '/marketing_campaigns/' + id;

  return function dopost(dispatch) {
    dispatch(updateMarketingCampaign());

    return request({
      url,
      data: JSON.stringify(params),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(marketingCampaignUpdated());
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'marketing_campaigns');
      });
  };
}

function requestCampaignDetails() {
  return {
    type: REQUEST_CAMPAIGN_DETAILS
  };
}

function recieveCampaignDetails(data) {
  return {
    type: RECIEVE_CAMPAIGN_DETAILS,
    details: data.marketing_campaign
  };
}

export function fetchCampaignDetails(id) {
  const url = apiUrl + '/marketing_campaigns/' + id;

  return function dofetch(dispatch) {
    dispatch(requestCampaignDetails());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recieveCampaignDetails(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'marketing_campaigns');
      });
  };
}

function createSavedSearch(data) {
  return {
    type: CREATE_SAVED_SEARCH
  };
}

function savedSearchCreated() {
  return {
    type: SAVED_SEARCH_CREATED
  };
}

export function saveSearch(data) {
  const url = apiUrl + '/saved_searches';
  return function doPost(dispatch) {
    dispatch(createSavedSearch());
    return request({
      url,
      method: 'POST',
      data: JSON.stringify(data),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(savedSearchCreated(response));
        dispatch(addContributorPoints('saveasearch'));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'post_saved_search');
      });
  };
}

function requestSavedSearches() {
  return {
    type: REQUEST_SAVED_SEARCHES
  };
}

function receiveSavedSearches(data) {
  return {
    type: RECEIVE_SAVED_SEARCHES,
    saved_searches: data.saved_searches
  };
}

export function clearSavedSearches() {
  return {
    type: CLEAR_SAVED_SEARCHES
  };
}

export function fetchSavedSearches() {
  const url = apiUrl + '/saved_searches';
  return function doFetch(dispatch) {
    dispatch(requestSavedSearches());
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveSavedSearches(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'saved_searches');
      });
  };
}

function deletingSavedSearch() {
  return {
    type: DELETE_SAVED_SEARCH
  };
}

function savedSearchDeleted() {
  return {
    type: SAVED_SEARCH_DELETED
  };
}

export function deleteSavedSearch(id) {
  const url = apiUrl + '/saved_searches/' + id;
  return function doDelete(dispatch) {
    dispatch(deletingSavedSearch());
    return request({
      url,
      method: 'DELETE',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(savedSearchDeleted(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'saved_searches');
      });
  };
}

function editingSavedSearch() {
  return {
    type: EDIT_SAVED_SEARCH
  };
}

function savedSearchEdited() {
  return {
    type: SAVED_SEARCH_EDITED
  };
}

export function editSavedSearch(id, data) {
  const url = apiUrl + '/saved_searches/' + id;
  return function doPost(dispatch) {
    dispatch(editingSavedSearch());
    return request({
      url,
      method: 'POST',
      data: JSON.stringify(data),
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(savedSearchEdited(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'saved_searches');
      });
  };
}

export function readNewFeatureTip(email, featureId, current_user) {
  const url = apiUrl + '/users/' + encodeURIComponent(email);
  const update = {
    properties: {
      read_new_feature_tip: {
        ...current_user.user.properties.read_new_feature_tip,
        [featureId]: true
      }
    }
  };
  return function doPost(dispatch) {
    dispatch(modifyCurrentUser());

    request({
      url,
      data: JSON.stringify(update),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(modifiedCurrentUser(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'read_new_feature_tip');
      });
  };
}

export function clearDocRef() {
  return dispatch => {
    dispatch({ type: CLEAR_DOC_REF });
  };
}

export function showFilters() {
  return { type: DISPLAY_FILTERS };
}

export function hideFilters() {
  return { type: HIDE_FILTERS };
}

export function toggleFilters() {
  return { type: TOGGLE_FILTERS };
}

function createSearchQuery(data) {
  return {
    type: CREATE_SEARCH_QUERY,
    search_args: data.search_args
  };
}

function searchQueryCreated() {
  return { type: SEARCH_QUERY_CREATED };
}

export function postSearchQuery(data) {
  const url = apiUrl + '/search_queries';
  return function doPost(dispatch) {
    dispatch(createSearchQuery(data));
    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(searchQueryCreated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'search_queries');
      });
  };
}

function requestSearchQueries() {
  return {
    type: REQUEST_SEARCH_QUERIES
  };
}

function recieveSearchQueries(data) {
  return {
    type: RECEIVE_SEARCH_QUERIES,
    search_queries: data.search_queries
  };
}

export function fetchSearchQueries(data = { num_queries: 3 }) {
  const url = apiUrl + '/search_queries';
  return function doFetch(dispatch) {
    dispatch(requestSearchQueries());
    return request({
      url,
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        // FIXME This is a temporary fix so search queryies with 0 docs don't show up in the
        // Common Searches on the dashboard
        const search_queries = response.search_queries;
        let queriesWithDocs = [];
        Promise.all(
          // for each search query get the number of docs
          search_queries.map(searchQuery => {
            const params = { ...searchQuery.search_args, ...{ get_count_only: true } };
            return request({
              url: apiUrl + '/documents',
              method: 'GET',
              data: params,
              crossOrigin: true,
              type: 'json',
              headers: {
                Authorization: localStorage.token
              }
            });
          })
        ).then(docs => {
          queriesWithDocs = search_queries.filter((searchQuery, i) => {
            return docs[i].count > 0;
          });
          // we want to display only 5 search queries
          response.search_queries = queriesWithDocs.slice(0, 5);
          dispatch(recieveSearchQueries(response));
          return response;
        });
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'search_queries');
      });
  };
}

function requestPopularDocs() {
  return {
    type: REQUEST_POPULAR_DOCS
  };
}

function recievePopularDocs(data) {
  return {
    type: RECEIVE_POPULAR_DOCS,
    popular_docs: data.popular_docs
  };
}

export function fetchPopularDocs(data = { num_queries: 5 }) {
  const url = apiUrl + '/popular_docs';
  return function doFetch(dispatch) {
    dispatch(requestPopularDocs());
    return request({
      url,
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recievePopularDocs(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'popular_docs');
      });
  };
}

function requestPopularSources() {
  return {
    type: REQUEST_POPULAR_SOURCES
  };
}

function recievePopularSources(data) {
  return {
    type: RECEIVE_POPULAR_SOURCES,
    popular_sources: data.popular_sources
  };
}

export function fetchPopularSources(data = { num_queries: 5 }) {
  const url = apiUrl + '/popular_sources';
  return function doFetch(dispatch) {
    dispatch(requestPopularSources());
    return request({
      url,
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recievePopularSources(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'popular_sources');
      });
  };
}

export function fetchIframeAutoComplete(data) {
  const url = apiUrl + '/suggestion';
  return function dofetch(dispatch) {
    dispatch(requestAutoComplete());

    return request({
      url,
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: iframeApiKey
      }
    })
      .then(response => {
        dispatch(receiveAutoComplete(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'autocomplete');
      });
  };
}

export function fetchIframeDocs(data) {
  const url = apiUrl + '/docs';
  return function dofetch(dispatch) {
    return request({
      url,
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: iframeApiKey
      }
    })
      .then(response => {
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'autocomplete');
      });
  };
}

export function setMobile(bool) {
  return {
    type: SET_MOBILE,
    bool
  };
}

function rateResult() {
  return {
    type: RATE_SEARCH_RESULT
  };
}

function resultRated(doc_id, is_relevant, search_args) {
  return {
    type: SEARCH_RESULT_RATED,
    doc_id,
    is_relevant,
    search_args
  };
}

// NOTE: The method `rateSearchResult` is also used in scenario's outside
// of an actual user search (ie. topic button relevancy)
export function rateSearchResult(doc_id, is_relevant, search_args) {
  const url = apiUrl + '/rated_results';

  return function dopost(dispatch) {
    dispatch(rateResult());
    return request({
      url,
      data: JSON.stringify({ doc_id, is_relevant, search_args }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(() => {
        dispatch(resultRated(doc_id, is_relevant, search_args));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'rate_search_result');
      });
  };
}

function requestContributorPoints() {
  return {
    type: REQUEST_CONTRIBUTOR_POINTS
  };
}

function recieveContributorPoints(data) {
  return {
    type: RECEIVE_CONTRIBUTOR_POINTS,
    data
  };
}

export function fetchContributorPoints(data = {}) {
  const url = apiUrl + '/contributor_points';
  return function doFetch(dispatch) {
    dispatch(requestContributorPoints());
    return request({
      url,
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recieveContributorPoints(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'popular_sources');
      });
  };
}

export function highlightSearch() {
  return {
    type: HIGHLIGHT_SEARCH
  };
}

export function fetchHiddenDocuments(data) {
  const url = apiUrl + '/hidden_documents';
  return function dofetch(dispatch) {
    dispatch(requestHiddenDocuments());

    request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveHiddenDocuments(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'HiddenDocuments');
      });
  };
}

export function fetchAnnotationJob(annotation_task_id) {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/annotation_tasks/' + annotation_task_id + '/annotation_jobs/pop';

  return function dofetch(dispatch) {
    dispatch(requestAnnotationJobs(annotation_task_id));

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAnnotationJobs(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'AnnotationJobs');
      });
  };
}

export function createAnnotationsForJob(annotation_task_id, annotation_job_id, params) {
  const url =
    apiUrl + '/annotation_tasks/' + annotation_task_id + '/annotation_jobs/' + annotation_job_id;

  return function dopost(dispatch) {
    dispatch(createAnnotations(annotation_task_id, annotation_job_id, params));

    return request({
      url,
      data: JSON.stringify(params),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(annotationsCreated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'annotationsForAnnotationJob');
      });
  };
}

export function fetchAllTermSamplingGroups() {
  const url = dataApiUrl + '/term_sampling_groups';

  return function dofetch(dispatch) {
    dispatch(requestAllTermSamplingGroups());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllTermSamplingGroups(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'termSamplingGroups');
      });
  };
}

export function createTermSamplingGroupsFromParams(params) {
  const url = dataApiUrl + '/term_sampling_groups';

  return function dopost(dispatch) {
    dispatch(createTermSamplingGroup(params));

    return request({
      url,
      data: JSON.stringify(params),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(termSamplingGroupCreated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'createTermSamplinGroup');
        dispatch(termSamplingGroupCreated(null));
      });
  };
}

export function updateTermSamplingGroupWithParams(term_sampling_group_id, data) {
  const url = dataApiUrl + '/term_sampling_groups/' + term_sampling_group_id;

  return function dopost(dispatch) {
    dispatch(updateTermSamplingGroup(data));

    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(termSamplingGroupUpdated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'updatedTermSamplingGroup');
        dispatch(termSamplingGroupUpdated(null));
      });
  };
}

export function fetchAnnotationStatistics(annotation_task_id, data) {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/annotation_tasks/' + annotation_task_id + '/topic_annotations';

  return function dofetch(dispatch) {
    dispatch(requestAnnotationStatistics(annotation_task_id));

    return request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAnnotationStatistics(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'AnnotationStatistics');
      });
  };
}

export function fetchAllAnnotationJobs(annotation_task_id, data) {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/annotation_tasks/' + annotation_task_id + '/annotation_jobs';

  return function dofetch(dispatch) {
    dispatch(requestAllAnnotationJobs(annotation_task_id));

    return request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllAnnotationJobs(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'AllAnnotationJobsByTaskId');
      });
  };
}

function createSubscription() {
  return {
    type: CREATE_SUBSCRIPTION
  };
}

function subscriptionCreated() {
  return {
    type: SUBSCRIPTION_CREATED
  };
}
export function subscribe(data) {
  const url = apiUrl + '/subscriptions';
  return function doFetch(dispatch) {
    dispatch(createSubscription());
    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(subscriptionCreated());
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'subscription');
      });
  };
}

function requestSubscriptions() {
  return {
    type: REQUEST_SUBSCRIPTIONS
  };
}

function receiveSubscriptions(data) {
  return {
    type: RECEIVE_SUBSCRIPTIONS,
    subscriptions: data.subscriptions
  };
}

export function fetchSubscriptions() {
  const url = apiUrl + '/subscriptions';
  return function doFetch(dispatch) {
    dispatch(requestSubscriptions());
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveSubscriptions(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'get subscriptions');
      });
  };
}

function createInvoiceRequest() {
  return {
    type: CREATE_INVOICE_REQUEST
  };
}

function invoiceRequestCreated() {
  return {
    type: INVOICE_REQUEST_CREATED
  };
}

export function requestInvoice(data) {
  const url = apiUrl + '/invoices';
  return function doFetch(dispatch) {
    dispatch(createInvoiceRequest());
    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(invoiceRequestCreated());
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'create invoice request');
      });
  };
}

export function fetchInsightsCsvBySlug(slug) {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/insights_csv/' + slug;

  return function dofetch(dispatch) {
    dispatch(requestInsightsCsv(slug));

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveInsightsCsv(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'InsightsCsv');
      });
  };
}

export function fetchAnnotationJobById(annotation_task_id, annotation_job_id) {
  // dispatch provided by magic middleware redux-thunk
  const url =
    apiUrl + '/annotation_tasks/' + annotation_task_id + '/annotation_jobs/' + annotation_job_id;

  return function dofetch(dispatch) {
    dispatch(requestAnnotationJobById(annotation_task_id, annotation_job_id));
    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAnnotationJobById(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'AnnotationJob');
      });
  };
}

function resendConfirmationEmail() {
  return {
    type: RESEND_CONFIRMATION_EMAIL
  };
}

function resentConfirmationEmail() {
  return {
    type: RESENT_CONFIRMATION_EMAIL
  };
}

export function sendConfirmationEmail(email) {
  const url = apiUrl + '/send_confirm_email';
  return function doPost(dispatch) {
    resendConfirmationEmail();
    return request({
      url,
      data: JSON.stringify({ email }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        resentConfirmationEmail();
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'send confirmation email');
      });
  };
}

export function notificationsUpdate(latest_stats) {
  return {
    type: NEW_NOTIFICATIONS_STATUS,
    latest_stats
  };
}

function followTopicsBegin(topics) {
  return {
    type: FOLLOW_TOPICS,
    topics
  };
}

function followedTopics(json) {
  return {
    type: FOLLOWED_TOPICS
  };
}

export function followTopics(topics) {
  const url = apiUrl + '/topics';

  return function dopost(dispatch) {
    dispatch(followTopicsBegin(topics));

    return request({
      url,
      data: JSON.stringify(topics),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(followedTopics(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'follow topics');
      });
  };
}

function requestTopics() {
  return {
    type: REQUEST_TOPICS
  };
}

function receiveTopics(json) {
  return {
    type: RECEIVE_TOPICS,
    topics: json.topics
  };
}

export function fetchTopics() {
  const url = apiUrl + '/topics';
  return function dofetch(dispatch) {
    dispatch(requestTopics());
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveTopics(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'topics');
      });
  };
}

export function fetchContributorStatistics(annotation_task_id, data) {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/annotation_tasks/' + annotation_task_id + '/contributor_review_breakdown';

  return function dofetch(dispatch) {
    dispatch(requestContributorStatistics(annotation_task_id));

    return request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveContributorStatistics(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'ContributorStatistics');
      });
  };
}

export function addBanner(banner_type, banner_status, content = {}, suppressCloseButton = false) {
  return {
    type: ADD_BANNER,
    banner_type,
    banner_status,
    content,
    suppressCloseButton
  };
}

export function fetchContributorReviewsCount(annotation_task_id, data) {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/annotation_tasks/' + annotation_task_id + '/contributor_reviews';

  return function dofetch(dispatch) {
    dispatch(requestContributorReviewsCount(annotation_task_id));

    return request({
      url,
      data,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveContributorReviewsCount(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'ContributorReviewsCount');
      });
  };
}

export function fetchAllSkippedAnnotations() {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/annotation_jobs/skipped';

  return function dofetch(dispatch) {
    dispatch(requestAllSkippedAnnotations());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllSkippedAnnotations(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'SkippedDocuments');
      });
  };
}

export function fetchAllSubscriptions() {
  // dispatch provided by magic middleware redux-thunk
  const url = apiUrl + '/subscriptions/all';

  return function dofetch(dispatch) {
    dispatch(requestAllSubscriptions());

    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllSubscriptions(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'all_subscriptions');
      });
  };
}

export function updateUserSubscription(subscription_id, params) {
  const url = apiUrl + '/subscriptions/' + subscription_id;

  return function dopost(dispatch) {
    dispatch(updateSubscription(subscription_id, params));

    return request({
      url,
      data: JSON.stringify(params),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(subscriptionUpdated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'Update subscription');
      });
  };
}

export function fetchAllPlans() {
  const url = apiUrl + '/plans';

  return function dofetch(dispatch) {
    dispatch(requestAllPlans());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllPlans(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'fetch all plans');
      });
  };
}

export function fetchAllTopics() {
  const url = dataApiUrl + '/topics';

  return function dofetch(dispatch) {
    dispatch(requestAllTopics());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAllTopics(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'fetch all topics');
      });
  };
}

export function fetchTopicsStats() {
  const url = apiUrl + '/topics_stats';

  return function dofetch(dispatch) {
    dispatch(requestTopicsStats());

    request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveTopicsStats(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'fetch_topics_stats');
      });
  };
}

export function createTopicFromParams(params) {
  const url = dataApiUrl + '/topics';

  return function dopost(dispatch) {
    dispatch(createTopic(params));

    return request({
      url,
      data: JSON.stringify(params),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(topicCreated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'create topic');
        dispatch(topicCreated(null));
      });
  };
}

export function updateTopicWithParams(topic_id, data) {
  const url = dataApiUrl + '/topics/' + topic_id;

  return function dopost(dispatch) {
    dispatch(updateTopic(data));

    return request({
      url,
      data: JSON.stringify(data),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(topicUpdated(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'update topic');
        dispatch(topicUpdated(null));
      });
  };
}

function requestTeams() {
  return {
    type: REQUEST_TEAMS
  };
}

function receiveTeams(data) {
  return {
    type: RECEIVE_TEAMS,
    teams: data.teams
  };
}

export function fetchTeams() {
  const url = apiUrl + '/teams';
  return function dofetch(dispatch) {
    dispatch(requestTeams());
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveTeams(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'teams');
      });
  };
}

function requestAddTeams() {
  return {
    type: REQUEST_ADD_TEAMS
  };
}

function receiveAddTeams() {
  return {
    type: RECEIVE_ADD_TEAMS
  };
}

export function addTeam(name) {
  const url = apiUrl + '/teams';
  return function dopost(dispatch) {
    dispatch(requestAddTeams());
    return request({
      url,
      data: JSON.stringify({ name }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAddTeams(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'teams');
      });
  };
}

function requestAddSharedFolder() {
  return {
    type: REQUEST_ADD_SHARED_FOLDER
  };
}

function receiveAddSharedFolder() {
  return {
    type: RECEIVE_ADD_SHARED_FOLDER
  };
}

export function addSharedFolder(folder_id, user_id, share) {
  const url = apiUrl + '/folders/' + folder_id;
  return function dopost(dispatch) {
    dispatch(requestAddSharedFolder());
    return request({
      url,
      data: JSON.stringify({ user_id, share }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAddSharedFolder(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folder_share');
      });
  };
}

function requestAddTeamMember() {
  return {
    type: REQUEST_ADD_TEAM_MEMBER
  };
}

function receiveAddTeamMember() {
  return {
    type: RECEIVE_ADD_TEAM_MEMBER
  };
}

export function addTeamMember(team_id, user_id) {
  const url = apiUrl + '/teams/' + team_id + '/team_members';
  return function dopost(dispatch) {
    dispatch(requestAddTeamMember());
    return request({
      url,
      data: JSON.stringify({ user_id }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAddTeamMember(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'teams');
      });
  };
}

function requestRemoveTeamMember() {
  return {
    type: REQUEST_REMOVE_TEAM_MEMBER
  };
}

function receiveRemoveTeamMember() {
  return {
    type: RECIEVE_REMOVE_TEAM_MEMBER
  };
}

export function removeTeamMember(team_id, user_id) {
  const url = apiUrl + '/teams/' + team_id + '/team_members';
  return function doDelete(dispatch) {
    dispatch(requestRemoveTeamMember());
    return request({
      url,
      data: JSON.stringify({ user_id }),
      method: 'DELETE',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveRemoveTeamMember(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'teams');
      });
  };
}

function requestAddSharedFolderUsers() {
  return {
    type: REQUEST_ADD_SHARED_FOLDER_USERS
  };
}

function recieveAddSharedFolderUsers() {
  return {
    type: RECEIVE_ADD_SHARED_FOLDER_USERS
  };
}

export function addSharedFolderUsers(folder_id, users, share_add_users, user_msg) {
  const url = apiUrl + '/folders/' + folder_id;
  return function dopost(dispatch) {
    dispatch(requestAddSharedFolderUsers());
    return request({
      url,
      data: JSON.stringify({ users, share_add_users, user_msg }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recieveAddSharedFolderUsers());
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folder_share');
      });
  };
}

function requestUpdateSharedFolderUsers() {
  return {
    type: REQUEST_UPDATE_SHARED_FOLDER_USERS
  };
}

function recieveUpdateSharedFolderUsers() {
  return {
    type: RECEIVE_UPDATE_SHARED_FOLDER_USERS
  };
}

export function updateSharedFolderUsers(folder_id, users, removed_users, update_share_permissions) {
  const url = apiUrl + '/folders/' + folder_id;
  return function dopost(dispatch) {
    dispatch(requestUpdateSharedFolderUsers());
    return request({
      url,
      data: JSON.stringify({ users, update_share_permissions, removed_users }),
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recieveUpdateSharedFolderUsers());
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'folder_share');
      });
  };
}

function requestAllTeamMembers() {
  return {
    type: REQUEST_ALL_TEAM_MEMBERS
  };
}

function recieveAllTeamMembers(data) {
  return {
    type: RECEIVE_ALL_TEAM_MEMBERS,
    team_members: data.team_members
  };
}

export function fetchAllTeamMembers(team_id) {
  const url = apiUrl + '/teams/' + team_id + '/team_members';
  return function dofetch(dispatch) {
    dispatch(requestAllTeamMembers());
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(recieveAllTeamMembers(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'teams');
      });
  };
}

export function openDeleteModal() {
  return {
    type: DELETE_CONFIRM_FOLDER_OPEN
  };
}

export function closeDeleteModal() {
  return {
    type: DELETE_CONFIRM_FOLDER_CLOSE
  };
}

export function openShareModal(menu) {
  return {
    type: SHARE_FOLDER_MENU_OPEN,
    menu
  };
}

export function closeShareModal(menu) {
  return {
    type: SHARE_FOLDER_MENU_CLOSE,
    menu
  };
}

export function openCopyFolderModal() {
  return {
    type: COPY_FOLDER_MENU_OPEN
  };
}

export function closeCopyFolderModal() {
  return {
    type: COPY_FOLDER_MENU_CLOSE
  };
}

export function fetchAgencySummaries(params) {
  const url = apiUrl + '/agency_summaries?agency_id=' + params.agency_id;
  return function dofetch(dispatch) {
    return request({
      url,
      method: 'GET',
      params,
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: iframeApiKey
      }
    })
      .then(response => {
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'agency_summaries');
      });
  };
}

export function fetchInsightsCsv(params) {
  const url = apiUrl + '/insights_csv_by_slug?slug=' + params.slug;
  return function dofetch(dispatch) {
    return request({
      url,
      method: 'GET',
      params,
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: iframeApiKey
      }
    })
      .then(response => {
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'insight csv');
      });
  };
}

export function skipOnboarding() {
  return {
    type: SKIP_ONBOARDING
  };
}

export function clearSkipOnboarding() {
  return {
    type: CLEAR_SKIP_ONBOARDING
  };
}

function requestAnnotationTaskTopicGroups() {
  return {
    type: REQUEST_ANNOTATION_TASK_TOPIC_GROUPS
  };
}

function receiveAnnotationTaskTopicGroups(data) {
  return {
    type: RECEIVE_ANNOTATION_TASK_TOPIC_GROUPS,
    annotation_task_topic_groups: data.annotation_task_groups
  };
}

export function fetchAnnotationTaskTopicGroups(id) {
  let url = apiUrl + '/annotation_task_groups';
  if (!_.isNil(id)) {
    url += `/${id}`;
  }
  return function doFetch(dispatch) {
    dispatch(requestAnnotationTaskTopicGroups());
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAnnotationTaskTopicGroups(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'annotationTaskTopicGroups');
      });
  };
}

function editAnnotationTaskTopicGroup() {
  return {
    type: EDIT_ANNOTATION_TOPIC_GROUP
  };
}

function annotationTaskTopicGroupEdited() {
  return {
    type: ANNOTATION_TOPIC_GROUP_EDITED
  };
}
export function postAnnotationTaskTopicGroup(data, id) {
  let url = apiUrl + `/annotation_task_groups`;
  if (!_.isNil(id)) {
    url += `/${id}`;
  }
  return function doFetch(dispatch) {
    dispatch(editAnnotationTaskTopicGroup());
    return request({
      url,
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(annotationTaskTopicGroupEdited(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'annotationTaskTopicGroups');
      });
  };
}

export function deleteAnnotationTaskTopicGroup(id) {
  const url = apiUrl + `/annotation_task_groups/${id}`;
  return function doFetch(dispatch) {
    return request({
      url,
      method: 'DELETE',
      data: JSON.stringify({}),
      crossOrigin: true,
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'annotationTaskTopicGroups');
      });
  };
}

function requestAggregatedAnnotations() {
  return {
    type: REQUEST_AGGREGATED_ANNOTATIONS
  };
}

function receiveAggregatedAnnotations(data) {
  return {
    type: RECEIVE_AGGREGATED_ANNOTATIONS,
    total: data.total,
    aggregated_annotations: data.aggregated_annotations
  };
}

export function fetchAllAggregatedAnnotations(data = {}) {
  const url = apiUrl + `/all_aggregated_annotations`;
  return function doFetch(dispatch) {
    dispatch(requestAggregatedAnnotations());
    return request({
      url,
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAggregatedAnnotations(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'aggregatedAnnotation');
      });
  };
}
export function fetchAggregatedAnnotations(topic_id, data = { sorting_doc_id: 'ascending' }) {
  const url = apiUrl + `/aggregated_annotations/` + topic_id;
  return function doFetch(dispatch) {
    dispatch(requestAggregatedAnnotations());
    return request({
      url,
      method: 'GET',
      data,
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveAggregatedAnnotations(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'aggregatedAnnotation');
      });
  };
}
export function editAggregatedAnnotationResearch(data, aggregated_annotation_id) {
  const url = apiUrl + `/aggregated_annotations/research/` + aggregated_annotation_id;
  return function doPost(dispatch) {
    return request({
      url,
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'aggregatedAnnotation');
      });
  };
}

export function fetchActiveTopicAnnotationModelIds(topic_id) {
  const url = dataApiUrl + `/topic_annotation_models?topic_id=` + topic_id;
  return function doFetch(dispatch) {
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'modelIds');
        return error;
      });
  };
}

export function editAggregatedAnnotationGold(data, aggregated_annotation_id) {
  const url = apiUrl + `/aggregated_annotations/gold/` + aggregated_annotation_id;
  return function doPost(dispatch) {
    return request({
      url,
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'aggregatedAnnotation');
        return error;
      });
  };
}

function requestSlotInfoForDoc(doc_type, slot, doc_id) {
  return {
    type: REQUEST_SLOT_INFO_FOR_DOC,
    doc_type,
    slot,
    doc_id
  };
}

function receiveSlotInfoForDoc(json) {
  return {
    type: RECEIVE_SLOT_INFO_FOR_DOC,
    slot_tool_doc: json
  };
}

export function fetchSlotInfoForDoc(doc_type, slot, doc_id) {
  const url = slotDataApiUrl + `/slot_tool/` + doc_type + `/` + slot + `/` + doc_id;
  return function doFetch(dispatch) {
    dispatch(requestSlotInfoForDoc(doc_type, slot, doc_id));
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveSlotInfoForDoc(response));
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'SlotInfoForDoc');
        return error;
      });
  };
}

export function editAggregatedAnnotation(data, aggregated_annotation_id) {
  const url = apiUrl + `/aggregated_annotations/` + aggregated_annotation_id;
  return function doPost(dispatch) {
    return request({
      url,
      method: 'POST',
      crossOrigin: true,
      type: 'json',
      data: JSON.stringify(data),
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'aggregatedAnnotation');
      });
  };
}

function requestSources() {
  return {
    type: REQUEST_SOURCES
  };
}

function receiveSources(data) {
  return {
    type: RECEIVE_SOURCES,
    sources: data
  };
}

export function fetchDefaultSources() {
  const url = apiUrl + `/sources`;
  return function doFetch(dispatch) {
    dispatch(requestSources());
    return request({
      url,
      method: 'GET',
      crossOrigin: true,
      type: 'json',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.token
      }
    })
      .then(response => {
        dispatch(receiveSources(response));
        return response;
      })
      .catch(error => {
        checkAndAddError(dispatch, error, 'sources');
      });
  };
}
