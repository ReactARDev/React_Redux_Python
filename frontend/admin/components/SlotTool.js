/* eslint react/no-did-update-set-state: 0 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  createAnnotationsForJob, fetchAllAnnotationJobs,
  fetchAnnotationJob,
  fetchSlotInfoForDoc
} from '../../shared/actions';
import { Button, Row, Col, FormGroup, FormControl } from 'react-bootstrap';
import DisplaCyENT from '../utils/displacy-ent';
import DisplaCy from '../utils/displacy';
import _ from 'lodash';

class SlotTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: '',
      previous_job_id: null,
      previousAnnotation: false,
      count: 0,
      showAlert: false,
      difficulty: '',
      arbitraryTags: '',
      task_id: null,
      doc_id: null,
      deps: {}, // n.b. for tracking open dependency trees
      vals: {}, // n.b. for tracking selected values
      loaded: false
    };
  }

  componentWillMount() {
    const { query } = this.props.location;
    const id = query.id;
    const slot_type = query.slot_type;
    this.setState({ task_id: id, slot_type });
    this.props.fetchAnnotationJob(id).then(response => {
      this.props.fetchSlotInfoForDoc('enforcement', slot_type, response.document.id);
    });
  }

  componentDidMount() {
    // get total number of annotations from queue
    this.props
      .fetchAllAnnotationJobs(this.state.task_id, {
        status: 'queued',
        count_only: true
      })
      .then(response => {
        this.setState({ total: response.total });
      });
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.annotation_jobs.isReady &&
      nextProps.annotation_jobs.items.annotation_job &&
      !_.isEqual(this.props.annotation_jobs, nextProps.annotation_jobs)
    ) {
      let previous_notes = '';
      if (nextProps.annotation_jobs.items.annotation_job.notes) {
        previous_notes = nextProps.annotation_jobs.items.annotation_job.notes;
      }
      this.setState({
        job_id: nextProps.annotation_jobs.items.annotation_job.id,
        notes: previous_notes,
        showAlert: false
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!this.props.slot_tool_doc_info || !this.props.slot_tool_doc_info.isReady ||
      !this.props.annotation_jobs || !this.props.annotation_jobs.isReady || this.state.loaded) {
      return;
    }

    const slot_tool_info = this.props.slot_tool_doc_info.slot_tool_doc;

    const default_ents = [ 'person', 'org', 'gpe', 'loc', 'product', 'law', 'event', 'misc',
      'work_of_art', 'act', 'named_regulation', 'date', 'money', 'cfr', 'usc', 'eo', 'publ', 'fr'
    ];

    // FIXME: some of this could probably be refactored into the render logic
    // and maybe that would allow us to avoid needing to use setState in here
    // however, the displacy library may be written in a way where that is difficult to do
    if (this.props.slot_tool_doc_info.slot_tool_doc && !this.state.loaded) {
      const new_sentences = {};
      for (let i = 0; i < slot_tool_info.nlp.ents.length; i++) {
        const idx = i.toString();
        const sent_id = 'sentence_' + idx;
        const ent_box = '#displacy_ents' + idx;
        const dep_box = '#displacy_deps' + idx;

        const score = slot_tool_info.nlp.scores[i].toString();
        const offset = slot_tool_info.nlp.offsets[i].toString();

        const ents = new DisplaCyENT('http://localhost:8000', { container: ent_box });
        const deps = new DisplaCy('http://localhost:8000', { container: dep_box });

        deps.render(slot_tool_info.nlp.deps[i], { manual: true });

        const s_spans = ents.render(slot_tool_info.nlp.ents[i].text,
          slot_tool_info.nlp.ents[i].ents, default_ents, offset);

        new_sentences[sent_id] = {
          sent_id,
          spans: s_spans,
          text: slot_tool_info.nlp.ents[i].text,
          score,
          offset,
          selected: [ ]
        };

        // n.b. these depend on the mark element that is created after the render code runs
        // also n.b., this needs to happen below the ents.render call above
        const e_node = document.querySelector(ent_box);
        e_node.querySelectorAll('mark').forEach(mark => {
          mark.addEventListener('click', (e) => {
            if (_.includes(e_node.classList, "selected_ent")) {
              mark.classList.toggle('unselected_span');
              mark.classList.toggle('selected_span');
              e.stopPropagation();
            }
          });
        });

        this.setState({ sentences: new_sentences, loaded: true });
      }
    }
  }

  // TODO: make this more react-y and use state info
  getParams = () => {
    const selected_sentences = [];
    document.querySelectorAll('.selected_sentence').forEach(sent => {
      const sent_id = sent.getAttribute('sent_id');
      const sent_obj = this.state.sentences[sent_id];
      sent.querySelectorAll('.selected_span').forEach(mark => {
        const span_id = mark.getAttribute('span_id');
        sent_obj.selected.push(span_id);
      });
      selected_sentences.push({ task_data: sent_obj });
    });

    const params = { selected_sentences };

    if (this.state.notes) {
      params.notes = this.state.notes;
    }
    if (this.state.difficulty) {
      params.user_difficulty = this.state.difficulty;
    }
    if (this.state.arbitraryTags && this.state.arbitraryTags.length > 0) {
      params.arbitrary_tags = this.state.arbitraryTags;
    }
    return params;
  };

  submit = () => {
    const new_state = {};
    if (!this.state.previousAnnotation) {
      new_state.count = this.state.count + 1;
      new_state.total = this.state.total - 1;
    }
    new_state.previous_job_id = this.state.job_id;
    new_state.difficulty = null;
    new_state.arbitraryTags = null;

    this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, this.getParams());
    this.setState(new_state);
    this.props.fetchAnnotationJob(this.state.task_id).then(response => {
      this.props.fetchSlotInfoForDoc('enforcement', this.state.slot_type, response.document.id).then(() => {
        this.setState({
          deps: {},
          vals: {},
          loaded: false
        });
      });
    });
  };

  handleDone = () => {
    this.props
      .createAnnotationsForJob(this.state.task_id, this.state.job_id, this.getParams())
      .then(() => {
        window.location = '#/dashboard';
      });
    this.setState({ difficulty: null, arbitraryTags: null });
  };

  isEmpty = str => {
    return str.length === 0 || !str.trim();
  };

  handleFieldChange = (changedfieldname, event) => {
    const new_state = {};
    new_state.showAlert = false;
    new_state[changedfieldname] = event.target.value;
    this.setState(new_state);
  };

  handleError = () => {
    this.setState({
      total: this.state.total - 1,
      previous_job_id: this.state.job_id,
      showAlert: false
    });
    const params = {};
    params.error = true;
    if (!this.isEmpty(this.state.notes)) {
      params.notes = this.state.notes;
    }
    this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, params);
    this.props.fetchAnnotationJob(this.state.task_id).then(response => {
      this.props.fetchSlotInfoForDoc('enforcement', this.state.slot_type, response.document.id).then(() => {
        this.setState({
          deps: {},
          vals: {},
          loaded: false
        });
      });
    });
  };

  handleSkip = () => {
    // Check that notes are provided for skipped document
    if (this.isEmpty(this.state.notes)) {
      this.setState({ showAlert: true });
    } else {
      this.setState({
        total: this.state.total - 1, previous_job_id: this.state.job_id
      });
      const params = {};
      params.skip = true;
      params.notes = this.state.notes;
      this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, params);
      this.props.fetchAnnotationJob(this.state.task_id).then(response => {
        this.props.fetchSlotInfoForDoc('enforcement', this.state.slot_type, response.document.id).then(() => {
          this.setState({
            deps: {},
            vals: {},
            loaded: false
          });
        });
      });
    }
  };

  openNextDocument = () => {
    this.setState({ total: this.state.total - 1 });
    this.props.fetchAnnotationJob(this.state.task_id);
  };

  openPreviousDocument = () => {
    this.setState({
      previous_job_id: null,
      showAlert: false,
      total: this.state.total + 1
    });
    const params = {};
    params.complete_later = true;
    this.props.createAnnotationsForJob(this.state.task_id, this.state.job_id, params);
    this.props.fetchAnnotationJobById(this.state.task_id, this.state.previous_job_id);
  };

  toggleDeps = (sent_id) => {
    const existing_deps = this.state.deps;
    if (existing_deps[sent_id]) {
      delete existing_deps[sent_id];
    } else {
      existing_deps[sent_id] = true;
    }
    const new_state = { deps: existing_deps };
    this.setState(new_state);
  };

  toggleVals = (sent_id) => {
    const existing_vals = this.state.vals;
    if (existing_vals[sent_id]) {
      delete existing_vals[sent_id];
    } else {
      existing_vals[sent_id] = true;
    }
    const new_state = { vals: existing_vals };
    this.setState(new_state);
  };

  render() {
    if (!this.props.slot_tool_doc_info || !this.props.slot_tool_doc_info.isReady ||
      !this.props.annotation_jobs || !this.props.annotation_jobs.isReady) {
      return null;
    }
    const initial_sentences = [];
    const slot_tool_info = this.props.slot_tool_doc_info.slot_tool_doc;
    const title = slot_tool_info.title;
    const doc_id = slot_tool_info.doc_id;

    for (let i = 0; i < slot_tool_info.divs.length; i++) {
      const score = slot_tool_info.nlp.scores[i].toString();
      const offset = slot_tool_info.nlp.offsets[i].toString();
      const red = Math.floor(255 - score * 255);
      const green = Math.floor(score * 255);
      const val_node_style = {
        backgroundColor: "rgba(" + red.toString() + "," + green.toString() + ",0,0.8)"
      };

      const s_text = "score=" + score;
      const o_text = "depth=" + offset;
      const v_text = "Sentence " + i + " (" + s_text + ", " + o_text + ")";
      const sent_id = 'sentence_' + i;

      initial_sentences.push(
        <div key={"displacy_wrapper" + i}>
          <hr className="hr_border" />
          <div
            id={"displacy_sens" + i}
            className={this.state.vals[i] ? "selected_sentence" : ""}
            sent_id={sent_id}
          >
            <div id={"displacy_header" + i} className={this.state.vals[i] ? "selected_value" : "unselected_value"}>
              <span id={"displacy_vals" + i} onClick={() => this.toggleVals(i)} style={val_node_style}>
                {v_text}
              </span>
            </div>
            <br /><br />
            <div
              id={"displacy_ents" + i}
              className={"tagged_sentence" + (this.state.vals[i] ? " selected_ent" : "")}
              onClick={() => this.toggleDeps(i)}
            />
            <div id={"displacy_deps" + i} className={this.state.deps[i] ? "" : "hidden_parse"} />
          </div>
        </div>
      );
    }
    return (
      <div>
        <Row>
          <Col sm={10}>
            <h3>{title} (Document {doc_id})</h3>
          </Col>
          <Col sm={2}>
            <div className="counter-container">
              <h1>{this.state.count}</h1>
              <p>completed</p>
              <p>this session</p>
              <p>Total queued: {this.state.total}</p>
            </div>
          </Col>
        </Row>
        <div id="content">{initial_sentences}</div>
        <hr className="hr_border" /><hr className="hr_border" /><hr className="hr_border" />
        <div className="button_container">
          <Button bsStyle="primary" onClick={this.submit}>
            Next
          </Button>
          {/*<Button
            bsStyle="primary"
            disabled={!this.state.previous_job_id}
            onClick={this.openPreviousDocument}
          >
            Back
          </Button>*/}
          <Button bsStyle="primary" onClick={this.handleError}>
            Error
          </Button>
          <Button bsStyle="primary" onClick={this.handleDone}>
            {"I'm done"}
          </Button>
          <Button bsStyle="primary" onClick={this.handleSkip}>
            Skip
          </Button>
        </div>

        <FormGroup className="topic-form-group">
          <Col sm={6}>
            <FormControl
              className="notes-text-area"
              componentClass="textarea"
              placeholder="Notes (required for skipped document)"
              value={this.state.notes}
              onChange={e => this.handleFieldChange('notes', e)}
            />
          </Col>
        </FormGroup>
        <div className={this.state.showAlert ? 'alert alert-danger' : 'hidden'} role="alert">
          {'Notes are required when skipping a document.'}
        </div>
      </div>
    );
  }
}

SlotTool.contextTypes = {
  router: PropTypes.object
};

const mapDispatchToProps = dispatch => {
  return {
    fetchSlotInfoForDoc: (doc_type, slot, doc_id) => {
      return dispatch(fetchSlotInfoForDoc(doc_type, slot, doc_id));
    },
    fetchAnnotationJob: task_id => {
      return dispatch(fetchAnnotationJob(task_id));
    },
    createAnnotationsForJob: (task_id, job_id, params) => {
      return dispatch(createAnnotationsForJob(task_id, job_id, params));
    },
    fetchAllAnnotationJobs: (task_id, params) => {
      return dispatch(fetchAllAnnotationJobs(task_id, params));
    }
  };
};

const mapStateToProps = state => {
  return {
    annotation_jobs: state.annotation_jobs,
    annotations_for_job: state.annotations_for_job,
    all_annotation_jobs: state.all_annotation_jobs,
    slot_tool_doc_info: state.slot_tool_doc_info
  };
};

const ReduxSlotTool = connect(mapStateToProps, mapDispatchToProps)(SlotTool);

export default ReduxSlotTool;
