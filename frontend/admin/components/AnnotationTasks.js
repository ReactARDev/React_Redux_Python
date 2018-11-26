import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Table, Button } from 'react-bootstrap';
import {
  fetchAllAnnotationTasks,
  fetchAllUsers,
  fetchAllTermSamplingGroups,
  deleteAnnotationTaskWithParams,
  fetchAllTopics
} from '../../shared/actions';
import AnnotationTaskModal from './AnnotationTaskModal';
import AnnotationStatistics from './AnnotationStatistics';
import moment from 'moment';
import { defaultFederalAgencies, defaultStateAgencies } from '../../shared/utils/defaultSources';
import DatePicker from 'react-datepicker';

class AnnotationTasks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      annotation_task_id: null,
      from_date: null,
      to_date: null
    };
  }

  componentWillMount() {
    this.props.fetchAllAnnotationTasks();
    this.props.fetchAllTopics();
    this.props.fetchAllUsers();
    this.props.fetchAllTermSamplingGroups();
  }

  getAgencyName = id => {
    let name = null;
    defaultFederalAgencies.forEach(agency => {
      if (agency.id === id) {
        name = agency.short_name;
      }
    });

    defaultStateAgencies.forEach(agency => {
      if (agency.id === id) {
        name = agency.short_name;
      }
    });
    return name;
  };

  updateAnnotationTasks = () => {
    this.setState({ from_date: null, to_date: null });
    this.props.fetchAllAnnotationTasks({});
  };

  openModal = annotation_task_id => {
    this.setState({ showModal: true, annotation_task_id });
  };

  closeModal = () => {
    this.setState({ showModal: false, annotation_task_id: null });
  };

  handleFromDateChange = date => {
    this.setState({ from_date: date });
  };

  handleToDateChange = date => {
    this.setState({ to_date: date });
  };

  render() {
    if (
      !this.props.all_annotation_tasks ||
      !this.props.all_annotation_tasks.isReady ||
      !this.props.all_users.isReady ||
      !this.props.term_sampling_groups.isReady
    ) {
      return null;
    }

    const list_items = [];

    const annotation_tasks = this.props.all_annotation_tasks.annotation_tasks;

    annotation_tasks.forEach(task => {
      let topics_display = '';
      if (task.topics) {
        topics_display = Object.keys(task.topics).join(', ');
      }
      const config = task.config;
      const filters = config ? config.doc_filters : {};

      const agency_id_display = () => {
        const result = [];
        filters.agency_id.forEach(id => {
          const name = this.getAgencyName(id);
          if (name) {
            result.push(name);
          }
        });
        return result.join(", ");
      };

      const add_paragraph = (p_array, label, value) => {
        p_array.push(
          <p key={p_array.length}>
            <b>{label}: </b>
            {value}
          </p>
        );
      };

      const num_touches_display = config ? config.num_touches : '';
      const doc_filters_displlay = () => {
        const result = [];
        if (!filters) {
          return '';
        }
        if (filters.agency_id) {
          add_paragraph(result, 'Agencies', agency_id_display());
        }
        if (filters.category) {
          if (Array.isArray(filters.category)) {
            add_paragraph(result, 'Category', filters.category.join(', '));
          } else {
            add_paragraph(result, 'Category', filters.category);
          }
        }
        if (filters.provenance) {
          add_paragraph(result, 'Provenance', filters.provenance);
        }
        if (filters.jurisdiction) {
          add_paragraph(result, 'Jurisdiction', filters.jurisdiction);
        }
        if (filters.published_from) {
          add_paragraph(
            result,
            'Published from',
            moment(filters.published_from).format('MM/DD/YYYY')
          );
        }
        if (filters.published_to) {
          add_paragraph(result, 'Published to', moment(filters.published_to).format('MM/DD/YYYY'));
        }
        if (filters.published_in_last_day) {
          add_paragraph(result, 'Published in last', 'day');
        }
        if (filters.published_in_last_week) {
          add_paragraph(result, 'Published in last', 'week');
        }
        return result;
      };

      const getUserEmails = ids => {
        if (ids) {
          const emails = [];
          for (const id of ids) {
            this.props.all_users.users.forEach(user => {
              if (user.id === id) {
                emails.push(user.email);
              }
            });
          }
          return emails.join(", ");
        }
        return '';
      };

      const getSamplingGroupNames = ids => {
        if (!ids) {
          return '';
        }
        const sampling_groups = [];
        for (const id of ids) {
          this.props.term_sampling_groups.items.term_sampling_groups.forEach(group => {
            if (group.id === id) {
              sampling_groups.push(<p>{group.name}</p>);
            }
          });
        }
        return sampling_groups;
      };

      const handleDeleteAnnotationTask = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        const total_annotation_count =
          this.props.annotation_task.statistics.total.positive +
          this.props.annotation_task.statistics.total.negative;
        const confirm_message =
          'This annotation task has topic annotations, ' + 'are you sure you want to delete it?';
        if (total_annotation_count > 0) {
          if (confirm(confirm_message)) {
            this.props
              .deleteAnnotationTaskWithParams(id, { delete_with_annotations: true })
              .then(() => {
                this.updateAnnotationTasks();
              });
          }
        } else {
          this.props.deleteAnnotationTaskWithParams(id, {}).then(() => {
            this.updateAnnotationTasks();
          });
        }
      };

      list_items.push(
        <tr key={task.id} onClick={() => this.openModal(task.id)}>
          <td>{task.name}</td>
          <td>{task.type}</td>
          <td>{task.status}</td>
          <td>{moment(task.created_at).format('MM/DD/YYYY')}</td>
          <td>{topics_display}</td>
          <td>{num_touches_display}</td>
          <td>{getUserEmails(task.user_ids)}</td>
          <td>{getSamplingGroupNames(task.term_sampling_group_ids)}</td>
          <td>{doc_filters_displlay()}</td>
          <AnnotationStatistics
            task_id={task.id}
            from_date={this.state.from_date ? this.state.from_date.format('MM/DD/YYYY') : null}
            to_date={this.state.to_date ? this.state.to_date.format('MM/DD/YYYY') : null}
          />
          <td>
            <Button
              bsStyle="primary"
              onClick={e => {
                handleDeleteAnnotationTask(e, task.id);
              }}
            >
              Delete
            </Button>
          </td>
        </tr>
      );
    });

    return (
      <div className="tasks-container">
        <h1>Annotation Tasks</h1>
        <Button bsStyle="primary" onClick={() => this.openModal()}>
          Create
        </Button>
        <Table striped condensed hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created</th>
              <th>Topics</th>
              <th>Opinions</th>
              <th>Assigned Users</th>
              <th>Sampling Groups</th>
              <th>Filters</th>
              <th>
                Completed Jobs
                <div className="">
                  <DatePicker
                    className="annotation-date"
                    placeholderText="From"
                    selected={this.state.from_date}
                    onChange={this.handleFromDateChange}
                    isClearable
                  />
                  <DatePicker
                    className="annotation-date"
                    placeholderText="To"
                    selected={this.state.to_date}
                    onChange={this.handleToDateChange}
                    isClearable
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>{list_items}</tbody>
        </Table>
        <AnnotationTaskModal
          close={this.closeModal}
          showModal={this.state.showModal}
          updateAnnotationTasks={this.updateAnnotationTasks}
          annotation_task_id={this.state.annotation_task_id}
        />
      </div>
    );
  }
}

AnnotationTasks.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchAllAnnotationTasks: () => {
      dispatch(fetchAllAnnotationTasks());
    },
    fetchAllUsers: () => {
      dispatch(fetchAllUsers());
    },
    fetchAllTopics: () => {
      dispatch(fetchAllTopics());
    },
    fetchAllTermSamplingGroups: () => {
      dispatch(fetchAllTermSamplingGroups());
    },
    deleteAnnotationTaskWithParams: (id, params) => {
      return dispatch(deleteAnnotationTaskWithParams(id, params));
    }
  };
};

const mapStateToProps = state => {
  return {
    all_annotation_tasks: state.all_annotation_tasks,
    all_users: state.all_users,
    term_sampling_groups: state.term_sampling_groups,
    annotation_task: state.annotation_task
  };
};

const ReduxAnnotationTasks = connect(mapStateToProps, mapDispatchToProps)(AnnotationTasks);

export default ReduxAnnotationTasks;
